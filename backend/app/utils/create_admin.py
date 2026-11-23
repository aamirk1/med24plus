import argparse
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.permissions import PermissionEnum, RoleEnum
from app.core.security import get_password_hash, validate_password_strength
from app.models.role import Permission, Role, RolePermission, UserRole
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
        # 1. Get or create super_admin role
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

        # 2. Ensure all granular permissions exist and are bound to super_admin
        for perm in PermissionEnum:
            p_slug = perm.value
            module = p_slug.split(".")[0] if "." in p_slug else "general"
            name = p_slug.replace(".", " ").title()
            existing_perm = session.execute(select(Permission).where(Permission.slug == p_slug)).scalar_one_or_none()
            if not existing_perm:
                existing_perm = Permission(name=name, slug=p_slug, module=module, description=f"Permission for {p_slug}")
                session.add(existing_perm)
                session.flush()

            # Link permission to super_role
            mapping = session.execute(
                select(RolePermission).where(
                    RolePermission.role_id == super_role.id,
                    RolePermission.permission_id == existing_perm.id,
                )
            ).scalar_one_or_none()
            if not mapping:
                session.add(RolePermission(role_id=super_role.id, permission_id=existing_perm.id))

        session.flush()

        # 3. Check existing user
        admin_user = session.execute(
            select(User).where((User.phone == norm_phone) | (User.email == norm_email))
        ).scalar_one_or_none()

        hashed = get_password_hash(password)

        if admin_user:
            admin_user.hashed_password = hashed
            admin_user.full_name = full_name.strip()
            admin_user.phone = norm_phone
            admin_user.email = norm_email
            admin_user.is_active = True
            admin_user.is_phone_verified = True
            admin_user.is_email_verified = True
            admin_user.status = "active"
            print(f"Updated existing user '{norm_phone}' with super admin credentials.")
        else:
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

        # 4. Ensure super_admin role assignment
        has_role = session.execute(
            select(UserRole).where(
                UserRole.user_id == admin_user.id,
                UserRole.role_id == super_role.id,
            )
        ).scalar_one_or_none()
        if not has_role:
            session.add(UserRole(user_id=admin_user.id, role_id=super_role.id))

        session.commit()
        print(f"Super admin user '{full_name}' ({norm_phone}) provisioned successfully with all permissions.")
    except Exception as e:
        session.rollback()
        print(f"Failed to create super admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()
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

