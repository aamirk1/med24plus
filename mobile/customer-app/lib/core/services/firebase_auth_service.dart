import 'dart:async';
import 'dart:developer' as developer;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

class FirebaseAuthService {
  static final FirebaseAuthService _instance = FirebaseAuthService._internal();
  factory FirebaseAuthService() => _instance;
  FirebaseAuthService._internal();

  FirebaseAuth? _auth;

  FirebaseAuth get auth {
    _auth ??= FirebaseAuth.instance;
    return _auth!;
  }

  /// Format Indian phone number to E.164 (+91XXXXXXXXXX)
  String formatPhoneNumber(String phone) {
    var cleaned = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (cleaned.startsWith('+91')) {
      return cleaned;
    }
    if (cleaned.startsWith('0') && cleaned.length == 11) {
      cleaned = cleaned.substring(1);
    }
    return '+91$cleaned';
  }

  /// Trigger SMS OTP via Firebase Authentication Phone Provider.
  /// Replaces third-party SMS service providers (Msg91 / Fast2SMS).
  Future<void> sendPhoneOtp({
    required String phoneNumber,
    required Function(String verificationId, int? resendToken) onCodeSent,
    required Function(String errorMessage) onError,
    Function(PhoneAuthCredential credential)? onAutoVerified,
    Function(String verificationId)? onTimeout,
    int? forceResendingToken,
  }) async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      final formattedPhone = formatPhoneNumber(phoneNumber);
      developer.log('Initiating Firebase Phone OTP for: $formattedPhone', name: 'FirebaseAuthService');

      await auth.verifyPhoneNumber(
        phoneNumber: formattedPhone,
        timeout: const Duration(seconds: 60),
        forceResendingToken: forceResendingToken,
        verificationCompleted: (PhoneAuthCredential credential) async {
          developer.log('Instant phone auto-verification completed.', name: 'FirebaseAuthService');
          if (onAutoVerified != null) {
            onAutoVerified(credential);
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          developer.log('Firebase verification failed: ${e.code} - ${e.message}', name: 'FirebaseAuthService');
          onError(e.message ?? 'Phone verification failed (${e.code}).');
        },
        codeSent: (String verificationId, int? resendToken) {
          developer.log('OTP code dispatched via Firebase. Verification ID: $verificationId', name: 'FirebaseAuthService');
          onCodeSent(verificationId, resendToken);
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          developer.log('Auto-retrieval timed out for: $verificationId', name: 'FirebaseAuthService');
          if (onTimeout != null) {
            onTimeout(verificationId);
          }
        },
      );
    } catch (e) {
      developer.log('Exception in sendPhoneOtp: $e', name: 'FirebaseAuthService');
      onError(e.toString());
    }
  }

  /// Verify user-submitted SMS OTP code against Firebase, authenticate,
  /// and retrieve the Firebase ID Token for backend validation.
  Future<String> verifyOtpAndGetIdToken({
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode.trim(),
      );

      final userCredential = await auth.signInWithCredential(credential);
      final user = userCredential.user;

      if (user == null) {
        throw Exception('User authentication failed on Firebase.');
      }

      final idToken = await user.getIdToken();
      if (idToken == null) {
        throw Exception('Failed to obtain Firebase ID token.');
      }

      developer.log('Firebase ID token successfully generated.', name: 'FirebaseAuthService');
      return idToken;
    } on FirebaseAuthException catch (e) {
      developer.log('FirebaseAuthException verifying code: ${e.code}', name: 'FirebaseAuthService');
      if (e.code == 'invalid-verification-code') {
        throw Exception('The verification code entered is invalid. Please try again.');
      } else if (e.code == 'session-expired') {
        throw Exception('Verification code has expired. Please request a new code.');
      }
      throw Exception(e.message ?? 'Failed to verify OTP with Firebase.');
    } catch (e) {
      developer.log('Error verifying OTP: $e', name: 'FirebaseAuthService');
      throw Exception('Verification failed: $e');
    }
  }
}
