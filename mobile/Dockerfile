# Prepares the source + toolchain. The Gradle release builds deliberately do NOT run
# here: `docker build` gives no control over DNS, and this machine's DNS drops often
# enough that a 15-minute build regularly died on
# "storage.googleapis.com: Name or service not known". They run via `docker run`
# instead (see build-release.sh), which can pin --dns and keep a warm Gradle cache.
FROM ghcr.io/cirruslabs/flutter:3.29.3 AS prep
WORKDIR /app

# Android SDK 36 (Android 16) and build-tools 36.0.0
# build-tools 34.0.0 is what AGP's lint step asks for; left to Gradle it tries to
# download it mid-build and fails ("Failed to install ... build-tools;34.0.0").
RUN yes | sdkmanager --install "platforms;android-36" "build-tools;36.0.0" "build-tools;34.0.0"

COPY . .

RUN flutter pub get
RUN dart run flutter_launcher_icons
# Catches real compile errors before the (much slower) release builds; warnings and
# infos are printed but don't fail the image.
RUN flutter analyze --no-fatal-infos --no-fatal-warnings
