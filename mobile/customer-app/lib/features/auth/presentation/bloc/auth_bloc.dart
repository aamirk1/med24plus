import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<AppStarted>(_onAppStarted);
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<SendOtpRequested>(_onSendOtpRequested);
    on<OtpVerificationRequested>(_onOtpVerificationRequested);
    on<PasswordResetRequested>(_onPasswordResetRequested);
    on<FirebaseOtpLoginRequested>(_onFirebaseOtpLoginRequested);
    on<FirebasePhoneVerifyRequested>(_onFirebasePhoneVerifyRequested);
  }

  Future<void> _onAppStarted(
    AppStarted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Restoring session...'));
    try {
      final user = await authRepository.getCurrentUser();
      if (user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } catch (_) {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Verifying credentials...'));
    try {
      final user = await authRepository.login(
        identifier: event.identifier,
        password: event.password,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Creating account...'));
    try {
      await authRepository.register(
        fullName: event.fullName,
        phone: event.phone,
        password: event.password,
        confirmPassword: event.confirmPassword,
        email: event.email,
      );
      emit(const AuthUnauthenticated('Registration successful! Please sign in.'));
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Signing out...'));
    try {
      await authRepository.logout();
    } catch (_) {}
    emit(const AuthUnauthenticated('Signed out successfully.'));
  }

  Future<void> _onSendOtpRequested(
    SendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Dispatching OTP...'));
    try {
      final devOtp = await authRepository.sendOtp(
        target: event.target,
        purpose: event.purpose,
      );
      emit(OtpSentState(
        target: event.target,
        purpose: event.purpose,
        devOtp: devOtp,
      ));
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onOtpVerificationRequested(
    OtpVerificationRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Verifying OTP...'));
    try {
      final isValid = await authRepository.verifyOtp(
        target: event.target,
        otpCode: event.otpCode,
        purpose: event.purpose,
      );
      if (isValid) {
        final user = await authRepository.getCurrentUser();
        if (user != null) {
          emit(AuthAuthenticated(user));
        } else {
          emit(const AuthUnauthenticated('OTP verified. Please sign in.'));
        }
      } else {
        emit(const AuthFailure('Invalid OTP verification code.'));
      }
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onPasswordResetRequested(
    PasswordResetRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Resetting password...'));
    try {
      final success = await authRepository.resetPassword(
        identifier: event.identifier,
        otpCode: event.otpCode,
        newPassword: event.newPassword,
        confirmPassword: event.confirmPassword,
      );
      if (success) {
        emit(const PasswordResetSuccess('Password reset successfully. Please sign in.'));
      } else {
        emit(const AuthFailure('Failed to reset password. Check OTP code.'));
      }
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onFirebaseOtpLoginRequested(
    FirebaseOtpLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Authenticating via Firebase...'));
    try {
      final user = await authRepository.loginWithFirebaseOtp(
        firebaseIdToken: event.firebaseIdToken,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }

  Future<void> _onFirebasePhoneVerifyRequested(
    FirebasePhoneVerifyRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading(message: 'Verifying with Firebase...'));
    try {
      final success = await authRepository.verifyFirebaseOtp(
        firebaseIdToken: event.firebaseIdToken,
        purpose: event.purpose,
        newPassword: event.newPassword,
        confirmPassword: event.confirmPassword,
      );
      if (success) {
        if (event.purpose == 'password_reset') {
          emit(const PasswordResetSuccess('Password reset successfully via Firebase. Please sign in.'));
        } else {
          final user = await authRepository.getCurrentUser();
          if (user != null) {
            emit(AuthAuthenticated(user));
          } else {
            emit(const AuthUnauthenticated('Mobile verified via Firebase. Please sign in.'));
          }
        }
      } else {
        emit(const AuthFailure('Firebase verification failed.'));
      }
    } catch (e) {
      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      emit(AuthFailure(errorMsg));
    }
  }
}


