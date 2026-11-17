from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel


class PaymentInitResult(BaseModel):
    gateway_name: str
    gateway_order_id: Optional[str] = None
    amount: Decimal
    currency: str = "INR"
    status: str = "pending"
    client_secret: Optional[str] = None
    instructions: Optional[str] = None


class PaymentVerificationResult(BaseModel):
    is_successful: bool
    payment_status: str  # 'pending', 'authorized', 'paid', 'failed'
    gateway_payment_id: Optional[str] = None
    gateway_signature: Optional[str] = None
    failure_reason: Optional[str] = None


class IPaymentIntegrationService(ABC):
    """
    Formal integration boundary interface for Indian Payment Gateways.
    Full implementation of Razorpay / UPI / Cashfree / Net Banking is scheduled for Phase 9.
    """

    @abstractmethod
    async def initiate_payment(self, order_id: uuid.UUID, amount: Decimal, currency: str) -> PaymentInitResult:
        """Initiate payment session with authorized payment gateway."""
        pass

    @abstractmethod
    async def verify_payment(self, order_id: uuid.UUID, payment_data: Dict[str, Any]) -> PaymentVerificationResult:
        """Verify payment webhook or client confirmation token."""
        pass


class DeferredPhase9PaymentService(IPaymentIntegrationService):
    """
    Phase 8 Placeholder Payment Boundary.
    Enforces that payment cannot be faked as successful and keeps payment-dependent fulfilment actions blocked.
    """

    async def initiate_payment(self, order_id: uuid.UUID, amount: Decimal, currency: str = "INR") -> PaymentInitResult:
        return PaymentInitResult(
            gateway_name="DEFERRED_PHASE9",
            gateway_order_id=None,
            amount=amount,
            currency=currency,
            status="pending",
            instructions="Online payment gateway integration (Razorpay / UPI / Cards) will be activated in Phase 9.",
        )

    async def verify_payment(self, order_id: uuid.UUID, payment_data: Dict[str, Any]) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            is_successful=False,
            payment_status="pending",
            failure_reason="Payment verification is deferred to Phase 9. Unverified payments cannot be approved.",
        )
