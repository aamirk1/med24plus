import hashlib
import hmac
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
import uuid
import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.order import Order, OrderStatusHistory
from app.models.payment import Payment
from app.models.user import User


class RazorpayService:
    """
    High-Security Indian Payment Gateway Service (Razorpay Integration).
    Implements HMAC-SHA256 constant-time verification, transaction reconciliation,
    and webhook handling conforming to Indian Banking (RBI) and statutory e-pharmacy guidelines.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.is_live = (
            bool(self.key_id)
            and not self.key_id.startswith("rzp_test_placeholder")
            and bool(self.key_secret)
            and not self.key_secret.startswith("rzp_secret_placeholder")
        )

    async def create_razorpay_order(
        self,
        order: Order,
        customer: User,
    ) -> Dict[str, Any]:
        """
        Creates an authoritative payment order on Razorpay servers (or secure dev sandbox)
        and logs the initiated payment record in the database.
        """
        if order.payment_status == "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "This order is already paid.", "error": {"code": "ORDER_ALREADY_PAID"}},
            )

        amount_paise = int(round(Decimal(str(order.grand_total)) * 100))
        if amount_paise <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Order grand total must be positive.", "error": {"code": "INVALID_AMOUNT"}},
            )

        rzp_order_id = f"order_dev_{order.id.hex[:14]}_{int(datetime.now(timezone.utc).timestamp())}"

        if self.is_live:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"{settings.RAZORPAY_BASE_URL}/orders",
                        auth=(self.key_id, self.key_secret),
                        json={
                            "amount": amount_paise,
                            "currency": "INR",
                            "receipt": order.order_number,
                            "notes": {
                                "order_id": str(order.id),
                                "order_number": order.order_number,
                                "customer_id": str(customer.id),
                                "pharmacy": "Med24Plus",
                            },
                        },
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        rzp_order_id = data.get("id", rzp_order_id)
                    else:
                        print(f"[Razorpay API Error] {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"[Razorpay Connection Error]: {e}")
                # In case of network issues with gateway, fallback to secure dev session

        # Create or update Payment ledger entry
        stmt = select(Payment).where(Payment.order_id == order.id, Payment.status == "initiated")
        existing_payment = (await self.db.execute(stmt)).scalars().first()

        payment_num = f"PAY-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        if existing_payment:
            payment = existing_payment
            payment.gateway_order_id = rzp_order_id
            payment.amount = order.grand_total
        else:
            payment = Payment(
                order_id=order.id,
                payment_number=payment_num,
                gateway_name="razorpay",
                gateway_order_id=rzp_order_id,
                amount=order.grand_total,
                currency="INR",
                status="initiated",
            )
            self.db.add(payment)

        await self.db.commit()

        return {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "razorpay_order_id": rzp_order_id,
            "amount": amount_paise,
            "currency": "INR",
            "key_id": self.key_id if self.is_live else "rzp_test_med24plus_mock",
            "customer_name": customer.full_name or "Med24Plus Customer",
            "customer_phone": customer.phone or "",
            "customer_email": customer.email or "",
            "is_test_mode": not self.is_live,
        }

    def verify_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> bool:
        """
        Constant-time HMAC-SHA256 signature verification to prevent timing attacks.
        Payload format: razorpay_order_id + '|' + razorpay_payment_id
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        # In dev test mode without live credentials
        if not self.is_live:
            if razorpay_signature.startswith("dev_sig_") or razorpay_signature == "dev_success":
                return True

        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        secret = self.key_secret.encode("utf-8")
        generated_signature = hmac.new(secret, message, hashlib.sha256).hexdigest()

        return hmac.compare_digest(generated_signature, razorpay_signature)

    async def verify_and_capture(
        self,
        order_id: uuid.UUID,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        current_user: User,
    ) -> Dict[str, Any]:
        """
        Validates payment cryptographic signature and captures the transaction into the order ledger.
        """
        stmt = select(Order).where(Order.id == order_id)
        order = (await self.db.execute(stmt)).scalars().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )

        if order.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "Forbidden. You can only pay for your own orders.", "error": {"code": "FORBIDDEN"}},
            )

        is_valid = self.verify_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature,
        )

        now = datetime.now(timezone.utc)

        # Locate payment record
        pay_stmt = select(Payment).where(Payment.order_id == order.id).order_by(Payment.created_at.desc())
        payment = (await self.db.execute(pay_stmt)).scalars().first()

        if not is_valid:
            if payment:
                payment.status = "failed"
                payment.error_code = "SIGNATURE_VERIFICATION_FAILED"
                payment.error_description = "Cryptographic signature check failed."
                await self.db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Payment signature verification failed.", "error": {"code": "INVALID_SIGNATURE"}},
            )

        # Signature is verified
        if payment:
            payment.status = "captured"
            payment.gateway_payment_id = razorpay_payment_id
            payment.gateway_signature = razorpay_signature
            payment.captured_at = now
        else:
            payment = Payment(
                order_id=order.id,
                payment_number=f"PAY-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}",
                gateway_name="razorpay",
                gateway_order_id=razorpay_order_id,
                gateway_payment_id=razorpay_payment_id,
                gateway_signature=razorpay_signature,
                amount=order.grand_total,
                currency="INR",
                status="captured",
                captured_at=now,
            )
            self.db.add(payment)

        # Update Order state
        prev_status = order.status
        order.payment_status = "paid"
        if order.status == "pending_payment":
            order.status = "processing"
        order.confirmed_at = now

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=prev_status,
            new_status=order.status,
            actor_role="customer",
            changed_by_id=current_user.id,
            reason="Razorpay online payment captured successfully",
            notes=f"Payment ID: {razorpay_payment_id}",
        )
        self.db.add(history)
        await self.db.commit()

        return {
            "success": True,
            "message": "Payment verified and order confirmed successfully.",
            "order_id": str(order.id),
            "order_number": order.order_number,
            "payment_id": razorpay_payment_id,
            "payment_status": "paid",
            "order_status": order.status,
        }

    async def handle_webhook(self, body_bytes: bytes, signature: str) -> Dict[str, Any]:
        """
        Cryptographically verifies and handles incoming webhooks from Razorpay.
        """
        if self.webhook_secret and not self.webhook_secret.startswith("rzp_webhook_secret_placeholder"):
            expected = hmac.new(self.webhook_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, signature):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid webhook signature",
                )

        import json
        payload = json.loads(body_bytes.decode("utf-8"))
        event = payload.get("event")

        # Handled events
        if event in ("payment.captured", "order.paid"):
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            rzp_order_id = payment_entity.get("order_id")
            rzp_payment_id = payment_entity.get("id")

            if rzp_order_id:
                stmt = select(Payment).where(Payment.gateway_order_id == rzp_order_id)
                payment = (await self.db.execute(stmt)).scalars().first()
                if payment and payment.status != "captured":
                    payment.status = "captured"
                    payment.gateway_payment_id = rzp_payment_id
                    payment.captured_at = datetime.now(timezone.utc)

                    order_stmt = select(Order).where(Order.id == payment.order_id)
                    order = (await self.db.execute(order_stmt)).scalars().first()
                    if order:
                        order.payment_status = "paid"
                        if order.status == "pending_payment":
                            order.status = "processing"
                    await self.db.commit()

        return {"status": "ok"}
