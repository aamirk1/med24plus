import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    super.fullName,
    required super.phone,
    super.email,
    required super.isActive,
    required super.isPhoneVerified,
    required super.isEmailVerified,
    required super.status,
    required super.roles,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      fullName: json['full_name'] as String?,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      isPhoneVerified: json['is_phone_verified'] as bool? ?? false,
      isEmailVerified: json['is_email_verified'] as bool? ?? false,
      status: json['status'] as String? ?? 'active',
      roles: (json['roles'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'phone': phone,
      'email': email,
      'is_active': isActive,
      'is_phone_verified': isPhoneVerified,
      'is_email_verified': isEmailVerified,
      'status': status,
      'roles': roles,
    };
  }
}

