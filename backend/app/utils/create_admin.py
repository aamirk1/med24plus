import argparse
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.permissions import RoleEnum
from app.core.security import get_password_hash, validate_password_strength
from app.models.role import Role, UserRole
from app.models.user import User, UserProfile
from app.services.auth_service import normalize_email, normalize_phone


def create_super_admin(phone: str, email: str, password: str, full_name: str):
    """Secure command-line utility to provision a super-admin user account."""
    is_strong, reason = validate_password_strength(password)
    if not is_strong:
        print(f"Error: {reason}", file=sys.stderr)
        sys.exit(1)

    norm_phone = normalize_phone(phone)
    norm_email = normalize_email(email)

    engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Check existing
        existing = session.execute(
            select(User).where((User.phone == norm_phone) | (User.email == norm_email))
        ).scalar_one_or_none()

        if existing:
            print(f"User with phone {norm_phone} or email {norm_email} already exists.", file=sys.stderr)
            sys.exit(1)

        # Get super_admin role
        super_role = session.execute(
            select(Role).where(Role.slug == RoleEnum.SUPER_ADMIN.value)
        ).scalar_one_or_none()
        if not super_role:
            super_role = Role(
                name="Super Admin",
                slug=RoleEnum.SUPER_ADMIN.value,
                description="Global Super Administrator",
                is_system_role=True,
            )
            session.add(super_role)
            session.flush()

        hashed = get_password_hash(password)
        admin_user = User(
            phone=norm_phone,
            email=norm_email,
            hashed_password=hashed,
            full_name=full_name.strip(),
            is_active=True,
            is_phone_verified=True,
            is_email_verified=True,
            status="active",
        )
        session.add(admin_user)
        session.flush()

        profile = UserProfile(user_id=admin_user.id)
        session.add(profile)
        session.add(UserRole(user_id=admin_user.id, role_id=super_role.id))

        session.commit()
        print(f"Super admin user '{full_name}' ({norm_phone}) provisioned successfully.")
    except Exception as e:
        session.rollback()
        print(f"Failed to create super admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create Med24Plus Super Admin Account")
    parser.add_argument("--phone", required=True, help="10-digit mobile number (+91)")
    parser.add_argument("--email", required=True, help="Super admin email address")
    parser.add_argument("--password", required=True, help="Strong password")
    parser.add_argument("--name", default="Super Administrator", help="Full name")
    args = parser.parse_args()

    create_super_admin(phone=args.phone, email=args.email, password=args.password, full_name=args.name)

