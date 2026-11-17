import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AppStarted extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String identifier;
  final String password;

  const LoginRequested({
    required this.identifier,
    required this.password,
  });

  @override
  List<Object?> get props => [identifier, password];
}

class RegisterRequested extends AuthEvent {
  final String fullName;
  final String phone;
  final String password;
  final String confirmPassword;
  final String? email;

  const RegisterRequested({
    required this.fullName,
    required this.phone,
    required this.password,
    required this.confirmPassword,
    this.email,
  });

  @override
  List<Object?> get props => [fullName, phone, password, confirmPassword, email];
}

class LogoutRequested extends AuthEvent {}

class RefreshRequested extends AuthEvent {}

class SendOtpRequested extends AuthEvent {
  final String target;
  final String purpose;

  const SendOtpRequested({
    required this.target,
    required this.purpose,
  });

  @override
  List<Object?> get props => [target, purpose];
}

class OtpVerificationRequested extends AuthEvent {
  final String target;
  final String otpCode;
  final String purpose;

  const OtpVerificationRequested({
    required this.target,
    required this.otpCode,
    required this.purpose,
  });

  @override
  List<Object?> get props => [target, otpCode, purpose];
}

class PasswordResetRequested extends AuthEvent {
  final String identifier;
  final String otpCode;
  final String newPassword;
  final String confirmPassword;

  const PasswordResetRequested({
    required this.identifier,
    required this.otpCode,
    required this.newPassword,
    required this.confirmPassword,
  });

  @override
  List<Object?> get props => [identifier, otpCode, newPassword, confirmPassword];
}

