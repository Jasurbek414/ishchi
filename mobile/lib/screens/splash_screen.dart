import 'package:flutter/material.dart';

import '../core/app_assets.dart';
import '../core/theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // White disc: the logo's navy figure would sink into the blue background.
            DecoratedBox(
              decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Image(image: AssetImage(AppAssets.logo), width: 112, height: 112),
              ),
            ),
            SizedBox(height: 16),
            Text(
              'Ishchi',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 24),
            CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
