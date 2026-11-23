import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.permissions import ROLE_DEFAULT_PERMISSIONS, PermissionEnum, RoleEnum
from app.core.security import get_password_hash
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.staff import PharmacistProfile, StaffProfile
from app.models.user import User, UserProfile


def seed_phase4_auth_sync(engine=None):
    """Seed system roles, granular permissions, role mappings, and dev user accounts."""
    if engine is None:
        engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("1. Ensuring all required Phase 4 roles exist...")
        roles_to_ensure = [
            (RoleEnum.SUPER_ADMIN.value, "Super Admin", "Super administrator with unrestricted global access"),
            (RoleEnum.ADMIN.value, "Administrator", "Operational administrator managing inventory, orders, and staff"),
            (RoleEnum.PHARMACIST.value, "Pharmacist", "Registered Pharmacist under D&C Rules, 1945 for prescription verification"),
            (RoleEnum.STAFF.value, "Staff", "Operational pharmacy and warehouse staff"),
            (RoleEnum.DELIVERY_PARTNER.value, "Delivery Partner", "Hyperlocal fleet and delivery partner personnel"),
            (RoleEnum.CUSTOMER.value, "Customer", "Retail online medicine platform patient and consumer"),
        ]

        roles_map = {}
        for slug, name, desc in roles_to_ensure:
            role = session.execute(select(Role).where(Role.slug == slug)).scalar_one_or_none()
            if not role:
                role = Role(name=name, slug=slug, description=desc, is_system_role=True)
                session.add(role)
                session.flush()
                print(f"  + Created role: {slug}")
            roles_map[slug] = role

        print("2. Ensuring all granular permissions exist...")
        perms_map = {}
        for perm in PermissionEnum:
            p_slug = perm.value
            module = p_slug.split(".")[0] if "." in p_slug else "general"
            name = p_slug.replace(".", " ").title()
            existing = session.execute(select(Permission).where(Permission.slug == p_slug)).scalar_one_or_none()
            if not existing:
                existing = Permission(name=name, slug=p_slug, module=module, description=f"Permission for {p_slug}")
                session.add(existing)
                session.flush()
                print(f"  + Created permission: {p_slug}")
            perms_map[p_slug] = existing

        print("3. Binding permissions to roles...")
        for role_slug, perm_slugs in ROLE_DEFAULT_PERMISSIONS.items():
            role_obj = roles_map.get(role_slug)
            if not role_obj:
                continue
            for p_slug in perm_slugs:
                perm_obj = perms_map.get(p_slug)
                if not perm_obj:
                    continue
                mapping = session.execute(
                    select(RolePermission).where(
                        RolePermission.role_id == role_obj.id,
                        RolePermission.permission_id == perm_obj.id,
                    )
                ).scalar_one_or_none()
                if not mapping:
                    session.add(RolePermission(role_id=role_obj.id, permission_id=perm_obj.id))

        session.flush()

        print("4. Creating / Updating development demonstration accounts...")
        dev_accounts = [
            {
                "phone": "+919800000001",
                "email": "superadmin@med24plus.in",
                "full_name": "Dr. Super Admin",
                "role": RoleEnum.SUPER_ADMIN.value,
                "password": "Password@123",
            },
            {
                "phone": "+919800000002",
                "email": "admin@med24plus.in",
                "full_name": "Operations Admin",
                "role": RoleEnum.ADMIN.value,
                "password": "Password@123",
            },
            {
                "phone": "+919800000003",
                "email": "pharmacist@med24plus.in",
                "full_name": "Pharmacist Rajesh Sharma",
                "role": RoleEnum.PHARMACIST.value,
                "password": "Password@123",
                "is_verified_pharmacist": True,
            },
            {
                "phone": "+919800000004",
                "email": "pharmacist_unverified@med24plus.in",
                "full_name": "Pending Pharmacist Amit",
                "role": RoleEnum.PHARMACIST.value,
                "password": "Password@123",
                "is_verified_pharmacist": False,
            },
            {
                "phone": "+919800000005",
                "email": "staff@med24plus.in",
                "full_name": "Warehouse Staff Priya",
                "role": RoleEnum.STAFF.value,
                "password": "Password@123",
            },
            {
                "phone": "+919800000006",
                "email": "delivery@med24plus.in",
                "full_name": "Delivery Agent Vikram",
                "role": RoleEnum.DELIVERY_PARTNER.value,
                "password": "Password@123",
            },
            {
                "phone": "+919876543210",
                "email": "customer@med24plus.in",
                "full_name": "Demo Customer Sunita",
                "role": RoleEnum.CUSTOMER.value,
                "password": "Password@123",
            },
        ]

        for acc in dev_accounts:
            existing = session.execute(select(User).where(User.phone == acc["phone"])).scalar_one_or_none()
            if not existing:
                hashed = get_password_hash(acc["password"])
                user = User(
                    phone=acc["phone"],
                    email=acc["email"],
                    hashed_password=hashed,
                    full_name=acc["full_name"],
                    is_active=True,
                    is_phone_verified=True,
                    is_email_verified=True,
                    status="active",
                )
                session.add(user)
                session.flush()

                # User profile
                profile = UserProfile(user_id=user.id, emergency_contact="+919876543211")
                session.add(profile)

                # Assign role
                target_role = roles_map[acc["role"]]
                session.add(UserRole(user_id=user.id, role_id=target_role.id))

                # Special profiles
                if acc.get("is_verified_pharmacist") is not None:
                    pharm_prof = PharmacistProfile(
                        user_id=user.id,
                        registration_number="MH-PHARM-2024-88912" if acc["is_verified_pharmacist"] else "MH-PHARM-PENDING-001",
                        state_pharmacy_council="Maharashtra State Pharmacy Council",
                        registration_date=date(2020, 1, 15),
                        registration_valid_upto=date(2030, 12, 31),
                        is_verified=acc["is_verified_pharmacist"],
                        verified_at=datetime.now(timezone.utc) if acc["is_verified_pharmacist"] else None,
                        drug_license_number="DL-20B-114422",
                    )
                    session.add(pharm_prof)

                if acc["role"] == RoleEnum.STAFF.value:
                    staff_prof = StaffProfile(
                        user_id=user.id,
                        employee_id="MED24-EMP-104",
                        department="Fulfillment",
                        designation="Inventory Assistant",
                        employment_status="active",
                        date_of_joining=date(2023, 6, 1),
                    )
                    session.add(staff_prof)

                session.flush()
                print(f"  + Created dev account: {acc['phone']} ({acc['role']})")
            else:
                # Ensure hashed password is updated to Argon2id
                if not existing.hashed_password or not existing.hashed_password.startswith("$argon2"):
                    existing.hashed_password = get_password_hash(acc["password"])
                    print(f"  ~ Upgraded password to Argon2id for: {acc['phone']}")

        session.commit()
        print("Phase 4 authentication seeding completed successfully.")
    except Exception as e:
        session.rollback()
        print(f"Error during Phase 4 seeding: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_phase4_auth_sync()
