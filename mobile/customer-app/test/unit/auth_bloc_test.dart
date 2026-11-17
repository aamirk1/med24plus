import 'package:flutter_test/flutter_test.dart';
import 'package:med24plus/features/auth/domain/entities/user_entity.dart';
import 'package:med24plus/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:med24plus/features/auth/presentation/bloc/auth_event.dart';
import 'package:med24plus/features/auth/presentation/bloc/auth_state.dart';
import '../mocks/fake_auth_repository.dart';

void main() {
  group('AuthBloc Unit Tests', () {
    late FakeAuthRepository fakeAuthRepository;
    late AuthBloc authBloc;

    setUp(() {
      fakeAuthRepository = FakeAuthRepository();
      authBloc = AuthBloc(authRepository: fakeAuthRepository);
    });

    tearDown(() {
      authBloc.close();
    });

    test('Initial state is AuthInitial', () {
      expect(authBloc.state, equals(AuthInitial()));
    });

    test('AppStarted emits [AuthLoading, AuthAuthenticated] when session exists', () async {
      final expected = [
        const AuthLoading(message: 'Restoring session...'),
        AuthAuthenticated(fakeAuthRepository.currentUser!),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(AppStarted());
    });

    test('AppStarted emits [AuthLoading, AuthUnauthenticated] when no session exists', () async {
      fakeAuthRepository.currentUser = null;

      final expected = [
        const AuthLoading(message: 'Restoring session...'),
        const AuthUnauthenticated(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(AppStarted());
    });

    test('LoginRequested emits [AuthLoading, AuthAuthenticated] on success', () async {
      const user = UserEntity(
        id: 'u-1',
        fullName: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul@example.com',
        isActive: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        status: 'active',
        roles: ['customer'],
      );
      fakeAuthRepository.currentUser = user;

      final expected = [
        const AuthLoading(message: 'Verifying credentials...'),
        const AuthAuthenticated(user),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const LoginRequested(
        identifier: '+919876543210',
        password: 'Password@123',
      ));
    });

    test('RegisterRequested emits [AuthLoading, AuthUnauthenticated] on success', () async {
      final expected = [
        const AuthLoading(message: 'Creating account...'),
        const AuthUnauthenticated('Registration successful! Please sign in.'),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const RegisterRequested(
        fullName: 'New Customer',
        phone: '+919811122233',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        email: 'new@example.com',
      ));
    });

    test('LogoutRequested emits [AuthLoading, AuthUnauthenticated]', () async {
      final expected = [
        const AuthLoading(message: 'Signing out...'),
        const AuthUnauthenticated('Signed out successfully.'),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(LogoutRequested());
    });

    test('SendOtpRequested emits [AuthLoading, OtpSentState]', () async {
      final expected = [
        const AuthLoading(message: 'Dispatching OTP...'),
        const OtpSentState(
          target: '+919876543210',
          purpose: 'password_reset',
          devOtp: '123456',
        ),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const SendOtpRequested(
        target: '+919876543210',
        purpose: 'password_reset',
      ));
    });

    test('PasswordResetRequested emits [AuthLoading, PasswordResetSuccess]', () async {
      final expected = [
        const AuthLoading(message: 'Resetting password...'),
        const PasswordResetSuccess('Password reset successfully. Please sign in.'),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const PasswordResetRequested(
        identifier: '+919876543210',
        otpCode: '123456',
        newPassword: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      ));
    });

    test('FirebaseOtpLoginRequested emits [AuthLoading, AuthAuthenticated] on success', () async {
      final expected = [
        const AuthLoading(message: 'Authenticating via Firebase...'),
        AuthAuthenticated(fakeAuthRepository.currentUser!),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const FirebaseOtpLoginRequested(
        firebaseIdToken: 'sample_firebase_id_token_xyz',
      ));
    });

    test('FirebasePhoneVerifyRequested emits [AuthLoading, AuthAuthenticated] for phone verification', () async {
      final expected = [
        const AuthLoading(message: 'Verifying with Firebase...'),
        AuthAuthenticated(fakeAuthRepository.currentUser!),
      ];

      expectLater(authBloc.stream, emitsInOrder(expected));
      authBloc.add(const FirebasePhoneVerifyRequested(
        firebaseIdToken: 'sample_firebase_id_token_xyz',
        purpose: 'phone_verification',
      ));
    });
  });
}

