import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';
import '../core/constants/app_strings.dart';
import '../core/network/api_client.dart';
import '../core/services/push_notification_service.dart';
import '../core/services/secure_storage_service.dart';
import '../features/auth/data/datasources/auth_remote_data_source.dart';
import '../features/auth/data/repositories/auth_repository_impl.dart';
import '../features/auth/domain/repositories/auth_repository.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/bloc/auth_event.dart';

class OnlinePharmacyApp extends StatefulWidget {
  final AuthRepository? authRepository;

  const OnlinePharmacyApp({
    super.key,
    this.authRepository,
  });

  @override
  State<OnlinePharmacyApp> createState() => _OnlinePharmacyAppState();
}

class _OnlinePharmacyAppState extends State<OnlinePharmacyApp> {
  late final AuthRepository _authRepository;

  @override
  void initState() {
    super.initState();
    if (widget.authRepository != null) {
      _authRepository = widget.authRepository!;
    } else {
      final storage = SecureStorageService();
      final apiClient = ApiClient(storageService: storage);
      final remoteSource = AuthRemoteDataSourceImpl(apiClient: apiClient);
      _authRepository = AuthRepositoryImpl(
        remoteDataSource: remoteSource,
        secureStorage: storage,
      );
      // Initialize Firebase Cloud Messaging for Push Notifications
      PushNotificationService().initialize(apiClient: apiClient);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>(
      create: (context) => AuthBloc(authRepository: _authRepository)..add(AppStarted()),
      child: MaterialApp.router(
        title: AppStrings.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
