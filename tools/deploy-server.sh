#!/usr/bin/env bash
# Server-side half of .github/workflows/deploy.yml. Two commands:
#
#   deploy-server.sh deploy [SOURCE]   update the code, back up the database and rebuild the
#                                      backend, which applies any new migrations. SOURCE is a
#                                      git bundle file, or a branch to fetch from origin
#                                      (default: main)
#   deploy-server.sh publish-apk FILE  serve FILE as the app download (/uploads/apk/ishchi.apk)
#
# The workflow uploads this file together with a git bundle of the commit, so the server needs
# no access to the private repository. Both commands can also be run by hand on the server.
#
# Only the Ishchi compose project (the ishchi-* containers) is touched; nothing else on the
# server is started, stopped or rebuilt.
set -euo pipefail

log()  { printf '\n==> %s\n' "$*"; }
warn() { printf '\n!!  %s\n' "$*" >&2; }
die()  { printf '\nXATO: %s\n' "$*" >&2; exit 1; }

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@"; else docker-compose "$@"; fi
}

# --------------------------------------------------------------------------------------------
publish_apk() {
  local apk=${1:-}
  [ -f "$apk" ] || die "APK fayli topilmadi: $apk"
  log "APK saytga joylanmoqda"
  # As root inside the container: the image runs as `app`, and an apk/ directory made by an
  # earlier root-owned docker cp would not be writable by it.
  docker exec -u 0 ishchi-backend mkdir -p /app/uploads/apk
  docker cp "$apk" ishchi-backend:/app/uploads/apk/ishchi.apk.new
  # Swap in one step so nobody downloads a half-copied file.
  docker exec -u 0 ishchi-backend sh -c \
    'chmod 644 /app/uploads/apk/ishchi.apk.new && mv -f /app/uploads/apk/ishchi.apk.new /app/uploads/apk/ishchi.apk'
  log "Tayyor: yangi APK /uploads/apk/ishchi.apk manzilida"
}

# --------------------------------------------------------------------------------------------
deploy() {
  local source=${1:-main}

  # The project directory is wherever the running backend was started from, unless overridden.
  local dir=${DEPLOY_DIR:-$(docker inspect ishchi-backend \
    --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)}
  [ -n "$dir" ] && [ -f "$dir/docker-compose.yml" ] \
    || die "Loyiha papkasi topilmadi. DEPLOY_DIR=/loyiha/papkasi bilan qayta ishga tushiring."
  cd "$dir"
  log "Loyiha papkasi: $dir"

  # Never overwrite edits someone made on the server to tracked files.
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git status --short
    die "Serverdagi loyihada saqlanmagan o'zgarishlar bor (yuqorida). Ularni saqlang yoki bekor qiling."
  fi

  # --- .env: what this version needs ---------------------------------------------------------
  [ -f .env ] || die ".env fayli topilmadi ($dir/.env)."
  env_value() { sed -n "s/^$1=//p" .env | tail -n1 | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
  if [ -z "$(env_value APP_BASE_URL)" ]; then
    # Until now an unset APP_BASE_URL fell back to the default in application.yml; docker-compose
    # now insists on it being explicit. Writing down the value the server already runs with keeps
    # behaviour identical. DEFAULT_APP_BASE_URL comes from the workflow; by hand, set it in .env.
    [ -n "${DEFAULT_APP_BASE_URL:-}" ] \
      || die ".env faylida APP_BASE_URL yo'q. Qo'shing, masalan: APP_BASE_URL=https://api.uzbishchi.uz"
    cp .env ".env.bak-$(date +%Y%m%d-%H%M%S)"
    printf '\nAPP_BASE_URL=%s\n' "$DEFAULT_APP_BASE_URL" >> .env
    log ".env ga APP_BASE_URL=$DEFAULT_APP_BASE_URL qo'shildi (server hozir ham shu qiymatda ishlayapti; eski nusxa .env.bak-*)"
  fi
  if [ "$(env_value FIREBASE_CREDENTIALS_PATH)" = "/app/firebase-service-account.json" ]; then
    # docker-compose used to mount the credentials file itself at that path; it now mounts the
    # backend/secrets directory at /app/secrets, so the same file lives one level down.
    cp .env ".env.bak-$(date +%Y%m%d-%H%M%S)-firebase"
    sed -i 's|^FIREBASE_CREDENTIALS_PATH=.*|FIREBASE_CREDENTIALS_PATH=/app/secrets/firebase-service-account.json|' .env
    log ".env: FIREBASE_CREDENTIALS_PATH yangi joyga o'tkazildi (/app/secrets/firebase-service-account.json)"
  fi
  if [ ! -f backend/secrets/firebase-service-account.json ]; then
    warn "backend/secrets/firebase-service-account.json topilmadi — push-bildirishnomalar o'chiq bo'ladi (backend baribir ishlaydi)."
  fi

  # --- Code ------------------------------------------------------------------------------------
  local prev; prev=$(git rev-parse --short HEAD)
  log "Kod yangilanmoqda (hozirgi: $prev)"
  if [ -f "$source" ]; then
    git fetch --quiet "$source" HEAD
  else
    git fetch --quiet origin "$source" || die "origin dan '$source' olinmadi (repo'ga kirish yoki branch nomini tekshiring)."
  fi
  # A local branch rather than a detached HEAD, so the server's own checkout stays easy to read.
  git checkout --quiet -B deployed FETCH_HEAD
  local new; new=$(git rev-parse --short HEAD)
  log "Yangi versiya: $new — $(git log -1 --format=%s)"

  # --- Database backup -------------------------------------------------------------------------
  local db_user db_name backup_dir backup
  db_user=$(env_value DB_USER); db_user=${db_user:-ishchi}
  db_name=$(env_value DB_NAME); db_name=${db_name:-ishchi}
  backup_dir=${BACKUP_DIR:-$HOME/ishchi-backups}
  mkdir -p "$backup_dir"
  backup="$backup_dir/ishchi-$(date +%Y%m%d-%H%M%S)-$prev.sql.gz"
  log "Baza zaxiralanmoqda: $backup"
  docker exec ishchi-db pg_dump -U "$db_user" "$db_name" | gzip > "$backup"
  # Keep the latest 10. (ls is fine here: these names are generated above, never arbitrary.)
  # shellcheck disable=SC2012
  ls -1t "$backup_dir"/ishchi-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

  # --- Backend ---------------------------------------------------------------------------------
  log "Backend yig'ilmoqda va qayta ishga tushirilmoqda (yangi migratsiyalar shu yerda qo'llanadi)"
  compose up -d --build backend
  log "Backend javobini kutish"
  local healthy='' health
  for _ in $(seq 1 60); do
    # Captured rather than piped into grep -q: with pipefail, grep exiting early could fail curl.
    health=$(curl -fs http://127.0.0.1:8090/actuator/health 2>/dev/null || true)
    if [[ $health == *'"UP"'* ]]; then healthy=1; break; fi
    sleep 3
  done
  if [ -z "$healthy" ]; then
    docker logs --tail 80 ishchi-backend || true
    die "Backend 3 daqiqada ishga tushmadi (loglar yuqorida). Baza zaxirasi: $backup. Oldingi kod: git checkout $prev"
  fi
  log "Backend ishlayapti — $new"
}

case "${1:-deploy}" in
  deploy)      deploy "${2:-}" ;;
  publish-apk) publish_apk "${2:-}" ;;
  *)           die "Noma'lum buyruq: $1 (deploy | publish-apk)" ;;
esac
