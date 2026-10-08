#!/usr/bin/env bash
# Builds the signed release AAB + APK and drops them in ../releases/out.
# Run from anywhere:  bash mobile/build-release.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../releases/out"
mkdir -p "$out"

# MSYS_NO_PATHCONV stops Git Bash rewriting the CONTAINER-side paths (/out,
# /root/.gradle) into Windows paths; the HOST-side paths must therefore be converted
# by hand, since that same switch also disables the conversion they do need.
win() { (cd "$1" && pwd -W 2>/dev/null) || echo "$1"; }
ctx="$(win "$here")"
outwin="$(win "$out")"

export DOCKER_BUILDKIT=1

MSYS_NO_PATHCONV=1 docker build --progress=plain -t ishchi-build:prep "$ctx"

# --dns: this machine's resolver drops intermittently and Gradle's artifact downloads
#   are what notice first ("storage.googleapis.com: Name or service not known" killed
#   two 15-minute builds). Pinning public resolvers removes that failure mode.
# -m: this Docker VM also hosts live containers (service-core, savdo, tunnels), so the
#   build gets a ceiling instead of being free to starve them.
# Named volumes keep the Gradle cache and the NDK warm, so a retry costs minutes
#   rather than a full re-download.
run_build() {
  MSYS_NO_PATHCONV=1 docker run --rm \
    -m 5g \
    --dns 8.8.8.8 --dns 1.1.1.1 \
    -v ishchi-gradle:/root/.gradle \
    -v ishchi-ndk:/opt/android-sdk-linux/ndk \
    -v "$outwin:/out" \
    ishchi-build:prep bash -lc "$1"
}

# Bundle and APK run in separate containers on purpose: done back to back in one
# Gradle daemon, the APK's lint pass inherited the bundle's already-full metaspace
# and died with OutOfMemoryError: Metaspace. A fresh daemon per artifact avoids it.
run_build 'set -e
  flutter build appbundle --release --obfuscate --split-debug-info=build/symbols-aab
  cp build/app/outputs/bundle/release/app-release.aab /out/
  mkdir -p /out/symbols && rm -rf /out/symbols/aab && cp -r build/symbols-aab /out/symbols/aab'

run_build 'set -e
  flutter build apk --release --obfuscate --split-debug-info=build/symbols-apk
  cp build/app/outputs/flutter-apk/app-release.apk /out/
  mkdir -p /out/symbols && rm -rf /out/symbols/apk && cp -r build/symbols-apk /out/symbols/apk'

ls -l "$out"
