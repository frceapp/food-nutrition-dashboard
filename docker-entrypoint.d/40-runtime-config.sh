#!/bin/sh
set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /usr/share/nginx/html/config.js <<EOF
window.__NUTRIA_CONFIG__ = {
  FIREBASE_API_KEY: "$(escape_js "${FIREBASE_API_KEY:-}")",
  FIREBASE_AUTH_DOMAIN: "$(escape_js "${FIREBASE_AUTH_DOMAIN:-}")",
  FIREBASE_PROJECT_ID: "$(escape_js "${FIREBASE_PROJECT_ID:-}")",
  FIREBASE_STORAGE_BUCKET: "$(escape_js "${FIREBASE_STORAGE_BUCKET:-}")",
  FIREBASE_MESSAGING_SENDER_ID: "$(escape_js "${FIREBASE_MESSAGING_SENDER_ID:-}")",
  FIREBASE_APP_ID: "$(escape_js "${FIREBASE_APP_ID:-}")",
  APP_TIMEZONE: "$(escape_js "${APP_TIMEZONE:-Asia/Bangkok}")"
};
EOF
