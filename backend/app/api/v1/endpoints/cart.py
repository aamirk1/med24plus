import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemUpdateRequest,
    CartResponse,
)
from app.schemas.common import APIResponse
from app.services.cart_service import CartService

router = APIRouter()


@router.get(
    "",
    response_model=APIResponse[CartResponse],
    summary="Get customer active shopping cart",
)
async def get_my_cart(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve authenticated customer's active shopping cart.
    Recalculates selling prices, MRPs, discounts, taxes, and sellable stock availability.
    """
    service = CartService(db)
    cart = await service.get_cart(current_user.id)
    return APIResponse(
        success=True,
        message="Active shopping cart retrieved.",
        data=cart,
    )


@router.post(
    "/items",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add product to shopping cart",
)
async def add_item_to_cart(
    payload: CartItemAddRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add product to customer's active cart.
    If product already exists in cart, increments quantity.
    Enforces maximum quantity limits and sellable stock availability.
    DOES NOT reserve inventory.
    """
    service = CartService(db)
    cart = await service.add_item_to_cart(current_user.id, payload)
    return APIResponse(
        success=True,
        message="Product added to cart successfully.",
        data=cart,
    )


@router.patch(
    "/items/{item_id}",
    response_model=APIResponse[CartResponse],
    summary="Update cart item quantity",
)
async def update_cart_item(
    item_id: uuid.UUID,
    payload: CartItemUpdateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update quantity of a line item in customer's active cart.
    Quantity must be strictly positive and cannot exceed sellable stock.
    """
    service = CartService(db)
    cart = await service.update_cart_item_quantity(current_user.id, item_id, payload)
    return APIResponse(
        success=True,
        message="Cart item quantity updated.",
        data=cart,
    )


@router.delete(
    "/items/{item_id}",
    response_model=APIResponse[CartResponse],
    summary="Remove product item from cart",
)
async def remove_cart_item(
    item_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove an individual product line from the customer's shopping cart.
    """
    service = CartService(db)
    cart = await service.remove_cart_item(current_user.id, item_id)
    return APIResponse(
        success=True,
        message="Item removed from cart.",
        data=cart,
    )


@router.delete(
    "/items",
    response_model=APIResponse[CartResponse],
    summary="Clear all items from shopping cart",
)
async def clear_cart(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove all items from customer's active cart.
    """
    service = CartService(db)
    cart = await service.clear_cart(current_user.id)
    return APIResponse(
        success=True,
        message="Cart cleared successfully.",
        data=cart,
    )


@router.post(
    "/validate",
    response_model=APIResponse[CartResponse],
    summary="Revalidate cart items, stock, and prices",
)
async def validate_cart(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Revalidate active cart items against real-time catalog pricing and physical batch inventory.
    """
    service = CartService(db)
    cart = await service.get_cart(current_user.id)
    return APIResponse(
        success=True,
        message="Cart validated successfully.",
        data=cart,
    )
