import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/enums.dart';
import '../screens/about_screen.dart';
import '../screens/admin_notice_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/change_password_screen.dart';
import '../screens/edit_profile_screen.dart';
import '../screens/employer/employer_shell.dart';
import '../screens/employer/job_form_screen.dart';
import '../screens/employer/job_applications_screen.dart';
import '../screens/employer/job_manage_screen.dart';
import '../screens/employer/worker_detail_screen.dart';
import '../screens/employer/workers_map_screen.dart';
import '../screens/language_settings_screen.dart';
import '../screens/saved_searches_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/theme_settings_screen.dart';
import '../screens/wallet_screen.dart';
import '../screens/worker/employers_map_screen.dart';
import '../screens/worker/job_detail_screen.dart';
import '../screens/worker/jobs_map_screen.dart';
import '../screens/worker/my_applications_screen.dart';
import '../screens/worker/worker_shell.dart';
import '../state/auth_provider.dart';
import 'router_refresh.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = RouterRefreshNotifier(ref, authNotifierProvider);

  String? homePathFor(UserRole role) => switch (role) {
        UserRole.worker => '/worker',
        UserRole.employer => '/employer',
        UserRole.admin => '/admin',
      };

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final auth = ref.read(authNotifierProvider);
      final path = state.matchedLocation;
      const publicPaths = ['/login', '/register', '/otp', '/forgot-password'];
      final isPublic = publicPaths.any((p) => path.startsWith(p));

      if (auth.status == AuthStatus.unknown) {
        return path == '/splash' ? null : '/splash';
      }

      if (auth.status == AuthStatus.unauthenticated) {
        return isPublic ? null : '/login';
      }

      // authenticated
      if (path == '/splash' || isPublic) {
        return homePathFor(auth.role!);
      }
      if (path.startsWith('/profile/')) return null;

      final home = homePathFor(auth.role!)!;
      if (!path.startsWith(home)) {
        return home;
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: '/otp',
        builder: (context, state) => OtpScreen(phone: state.uri.queryParameters['phone'] ?? ''),
      ),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
      GoRoute(path: '/profile/edit', builder: (context, state) => const EditProfileScreen()),
      GoRoute(path: '/profile/wallet', builder: (context, state) => const WalletScreen()),
      GoRoute(path: '/profile/change-password', builder: (context, state) => const ChangePasswordScreen()),
      GoRoute(path: '/profile/about', builder: (context, state) => const AboutScreen()),
      GoRoute(path: '/profile/theme', builder: (context, state) => const ThemeSettingsScreen()),
      GoRoute(path: '/profile/language', builder: (context, state) => const LanguageSettingsScreen()),
      GoRoute(path: '/profile/saved-searches', builder: (context, state) => const SavedSearchesScreen()),
      GoRoute(path: '/admin', builder: (context, state) => const AdminNoticeScreen()),
      GoRoute(
        path: '/worker',
        builder: (context, state) => const WorkerShell(),
        routes: [
          GoRoute(
            path: 'jobs/:id',
            builder: (context, state) => JobDetailScreen(jobId: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: 'jobs-map',
            builder: (context, state) => const JobsMapScreen(),
          ),
          GoRoute(
            path: 'employers-map',
            builder: (context, state) => const EmployersMapScreen(),
          ),
          GoRoute(
            path: 'my-applications',
            builder: (context, state) => const MyApplicationsScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/employer',
        builder: (context, state) => const EmployerShell(),
        routes: [
          GoRoute(
            path: 'workers/:id',
            builder: (context, state) => WorkerDetailScreen(workerId: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: 'workers-map',
            builder: (context, state) => const WorkersMapScreen(),
          ),
          GoRoute(
            path: 'jobs/new',
            builder: (context, state) => const JobFormScreen(),
          ),
          GoRoute(
            path: 'jobs/:id/edit',
            builder: (context, state) => JobFormScreen(jobId: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: 'jobs/:id/manage',
            builder: (context, state) => JobManageScreen(jobId: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: 'jobs/:id/applications',
            builder: (context, state) =>
                JobApplicationsScreen(jobId: int.parse(state.pathParameters['id']!)),
          ),
        ],
      ),
    ],
  );
});
