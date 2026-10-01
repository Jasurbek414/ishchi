#!/usr/bin/env bash
# Deploys Ishchi on the server it runs on: updates the code, backs up the database, rebuilds
# the backend (which applies any new migrations) and, when Flutter is installed, builds and
# publishes the APK served at /uploads/apk/ishchi.apk.
#
# Run by .github/workflows/deploy.yml, which uploads this file together with a git bundle of
# the commit to deploy — so the server needs no GitHub access of its own. It can also be run
# by hand from the project directory:
#
#   bash tools/deploy-server.sh                      # deploys origin/main
#   bash tools/deploy-server.sh "" origin/some-branch
#
# It only touches the Ishchi compose project (the ishchi-* containers); nothing else on the
# server is started, stopped or rebuilt.
set -euo pipefail

BUNDLE=${1:-}
TARGET_REF=${2:-origin/main}

log()  { printf '\n==> %s\n' "$*"; }
warn() { printf '\n!!  %s\n' "$*" >&2; }
die()  { printf '\nXATO: %s\n' "$*" >&2; exit 1; }

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@"; else docker-compose "$@"; fi
}

# The project directory is wherever the running backend was started from, unless overridden.
DIR=${DEPLOY_DIR:-$(docker inspect ishchi-backend \
  --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)}
[ -n "$DIR" ] && [ -f "$DIR/docker-compose.yml" ] \
  || die "Loyiha papkasi topilmadi. DEPLOY_DIR=/loyiha/papkasi bilan qayta ishga tushiring."
cd "$DIR"
log "Loyiha papkasi: $DIR"

# Never overwrite edits someone made on the server to tracked files.
if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  die "Serverdagi loyihada saqlanmagan o'zgarishlar bor (yuqorida). Ularni saqlang yoki bekor qiling."
fi

# --- .env: what this version needs ---------------------------------------------------------
[ -f .env ] || die ".env fayli topilmadi ($DIR/.env)."
env_value() { sed -n "s/^$1=//p" .env | tail -n1 | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
[ -n "$(env_value APP_BASE_URL)" ] \
  || die ".env faylida APP_BASE_URL yo'q. Masalan: APP_BASE_URL=https://uzbishchi.uz — busiz backend ishga tushmaydi."
if [ "$(env_value FIREBASE_CREDENTIALS_PATH)" = "/app/firebase-service-account.json" ]; then
  warn ".env: FIREBASE_CREDENTIALS_PATH eski yo'lga qarab turibdi. Qatorni o'chiring va faylni backend/secrets/firebase-service-account.json ga qo'ying, aks holda push-bildirishnomalar o'chib qoladi."
fi

# --- Code ------------------------------------------------------------------------------------
PREV=$(git rev-parse --short HEAD)
log "Kod yangilanmoqda (hozirgi: $PREV)"
if [ -n "$BUNDLE" ]; then
  git fetch --quiet "$BUNDLE" HEAD
  TARGET=FETCH_HEAD
else
  git fetch --quiet origin
  TARGET=$TARGET_REF
fi
# A local branch rather than a detached HEAD, so the server's own checkout stays easy to read.
git checkout --quiet -B deployed "$TARGET"
NEW=$(git rev-parse --short HEAD)
log "Yangi versiya: $NEW — $(git log -1 --format=%s)"

# --- Database backup -------------------------------------------------------------------------
DB_USER=$(env_value DB_USER); DB_USER=${DB_USER:-ishchi}
DB_NAME=$(env_value DB_NAME); DB_NAME=${DB_NAME:-ishchi}
BACKUP_DIR=${BACKUP_DIR:-$HOME/ishchi-backups}
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/ishchi-$(date +%Y%m%d-%H%M%S)-$PREV.sql.gz"
log "Baza zaxiralanmoqda: $BACKUP"
docker exec ishchi-db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP"
# Keep the latest 10. (ls is fine here: these names are generated above, never arbitrary.)
# shellcheck disable=SC2012
ls -1t "$BACKUP_DIR"/ishchi-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

# --- Backend ---------------------------------------------------------------------------------
log "Backend yig'ilmoqda va qayta ishga tushirilmoqda (yangi migratsiyalar shu yerda qo'llanadi)"
compose up -d --build backend
log "Backend javobini kutish"
healthy=
for _ in $(seq 1 60); do
  # Captured rather than piped into grep -q: with pipefail, grep exiting early could fail curl.
  health=$(curl -fs http://127.0.0.1:8090/actuator/health 2>/dev/null || true)
  if [[ $health == *'"UP"'* ]]; then healthy=1; break; fi
  sleep 3
done
if [ -z "$healthy" ]; then
  docker logs --tail 80 ishchi-backend || true
  die "Backend 3 daqiqada ishga tushmadi (loglar yuqorida). Baza zaxirasi: $BACKUP. Oldingi kod: git checkout $PREV"
fi
log "Backend ishlayapti"

# --- APK -------------------------------------------------------------------------------------
# A non-interactive SSH session does not read .bashrc, so look in the usual install places too.
for d in "$HOME/flutter/bin" /opt/flutter/bin /usr/local/flutter/bin /snap/bin; do
  [ -d "$d" ] && PATH="$d:$PATH"
done
if ! command -v flutter >/dev/null 2>&1; then
  warn "Serverda Flutter topilmadi — APK yig'ilmadi. Backend va sayt yangilandi."
  exit 0
fi
if [ ! -f mobile/android/key.properties ]; then
  # Without the release keystore the APK is signed with a debug key, and phones that already
  # have the app refuse to update over it — publishing that would strand every existing user.
  warn "mobile/android/key.properties topilmadi — APK yig'ilmadi. Doimiy imzo kalitisiz chiqqan APK eski ilova ustidan o'rnatilmaydi."
  exit 0
fi

VERSION=$(sed -n 's/^version: *//p' mobile/pubspec.yaml)
log "APK yig'ilmoqda (versiya $VERSION)"
(cd mobile && flutter pub get && flutter build apk --release)
APK=mobile/build/app/outputs/flutter-apk/app-release.apk
[ -f "$APK" ] || die "APK fayli chiqmadi: $APK"

log "APK saytga joylanmoqda"
# As root inside the container: the image runs as `app`, and an apk/ directory made by an earlier
# root-owned docker cp would not be writable by it.
docker exec -u 0 ishchi-backend mkdir -p /app/uploads/apk
docker cp "$APK" ishchi-backend:/app/uploads/apk/ishchi.apk.new
# Swap in one step so nobody downloads a half-copied file.
docker exec -u 0 ishchi-backend sh -c 'chmod 644 /app/uploads/apk/ishchi.apk.new && mv -f /app/uploads/apk/ishchi.apk.new /app/uploads/apk/ishchi.apk'

log "Tayyor: backend $NEW, APK $VERSION — $(env_value APP_BASE_URL)/uploads/apk/ishchi.apk"
