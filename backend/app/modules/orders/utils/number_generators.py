import secrets
from datetime import datetime


def generate_order_number() -> str:
    """Generate unique, non-guessable Indian statutory order number format ORD-YYYYMMDD-XXXXXX."""
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = secrets.token_hex(3).upper()  # 6 hex chars
    return f"ORD-{date_str}-{random_suffix}"


def generate_invoice_number() -> str:
    """Generate unique GST tax invoice / cash memo number format INV-YYYYMMDD-XXXXXX."""
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = secrets.token_hex(3).upper()  # 6 hex chars
    return f"INV-{date_str}-{random_suffix}"
