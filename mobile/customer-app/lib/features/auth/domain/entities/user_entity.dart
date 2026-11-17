import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String? fullName;
  final String phone;
  final String? email;
  final bool isActive;
  final bool isPhoneVerified;
  final bool isEmailVerified;
  final String status;
  final List<String> roles;

  const UserEntity({
    required this.id,
    this.fullName,
    required this.phone,
    this.email,
    required this.isActive,
    required this.isPhoneVerified,
    required this.isEmailVerified,
    required this.status,
    required this.roles,
  });

  @override
  List<Object?> get props => [
        id,
        fullName,
        phone,
        email,
        isActive,
        isPhoneVerified,
        isEmailVerified,
        status,
        roles,
      ];
}

