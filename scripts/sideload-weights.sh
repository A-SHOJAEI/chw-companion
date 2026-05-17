#!/usr/bin/env bash
# Sideload gemma-4-E4B-it int4 weights into the CHW Companion app's data dir.
#
# Why this script exists:
#   `cactus-react-native`'s registry resolver looks at HuggingFace tags
#   (v1.x.y) that are <= the runtime version. As of 2026-05, the
#   `Cactus-Compute/gemma-4-E4B-it` repo only has the weights on `main`;
#   the `v1.13` tag is essentially empty. So the lib can't auto-download.
#
#   Sideloading bypasses the registry: when CactusLM's `model` parameter
#   starts with `/`, the lib treats it as an absolute path and skips its
#   own download flow (see CactusLM.ts L70 `isModelPath`).
#
# Prereqs:
#   - adb on PATH (`brew install --cask android-platform-tools`)
#   - An emulator running, or a real device with USB debugging + `adb root`
#   - The app installed (`com.cactusspike.chw` or your override)
#   - ~10 GB free on /tmp for the download + unzip
#
# Usage:
#   bash scripts/sideload-weights.sh
#   bash scripts/sideload-weights.sh --package org.chwcompanion.app
#   bash scripts/sideload-weights.sh --skip-download    # if /tmp/sideload/gemma-4-e4b-it already exists

set -euo pipefail

PKG="org.chwcompanion.app"
ZIP_URL="https://huggingface.co/Cactus-Compute/gemma-4-E4B-it/resolve/main/weights/gemma-4-e4b-it-int4.zip"
WORK_DIR="/tmp/sideload"
ZIP_PATH="${WORK_DIR}/gemma-4-e4b-it-int4.zip"
UNZIP_DIR="${WORK_DIR}/gemma-4-e4b-it"
SKIP_DOWNLOAD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --package)        PKG="$2"; shift 2;;
    --skip-download)  SKIP_DOWNLOAD=1; shift;;
    -h|--help)
      echo "Usage: $0 [--package <pkg>] [--skip-download]"
      exit 0;;
    *)
      echo "Unknown flag: $1" >&2; exit 1;;
  esac
done

DEVICE_DIR="/data/data/${PKG}/files/cactus/gemma-4-e4b-it"

echo "[sideload] target package: ${PKG}"
echo "[sideload] target device path: ${DEVICE_DIR}"

# 1) Sanity: device is attached
adb get-state >/dev/null
echo "[sideload] adb device OK"

# 2) Sanity: app is installed
if ! adb shell pm list packages | tr -d '\r' | grep -q "package:${PKG}$"; then
  echo "[sideload] ERROR: package ${PKG} is not installed on the device." >&2
  echo "             Run 'npx expo run:android' first." >&2
  exit 1
fi

# 3) adb root (emulator + userdebug only)
echo "[sideload] enabling adb root (skips silently on production builds)"
adb root || true
adb wait-for-device

# 4) Download + unzip
mkdir -p "${WORK_DIR}"
if [[ "$SKIP_DOWNLOAD" -eq 0 ]]; then
  echo "[sideload] downloading int4 zip (~6 GB) — this can take a few minutes"
  curl -L --progress-bar -o "${ZIP_PATH}" "${ZIP_URL}"
  rm -rf "${UNZIP_DIR}"
  mkdir -p "${UNZIP_DIR}"
  echo "[sideload] unzipping into ${UNZIP_DIR}"
  unzip -q "${ZIP_PATH}" -d "${UNZIP_DIR}"
fi
LOCAL_COUNT=$(ls "${UNZIP_DIR}" | wc -l | tr -d ' ')
echo "[sideload] local files: ${LOCAL_COUNT} (expected ≥ 2088)"

# 5) Push
echo "[sideload] clearing any partial existing dir on device"
adb shell rm -rf "${DEVICE_DIR}"
adb shell mkdir -p "${DEVICE_DIR}"

echo "[sideload] pushing weights to device (this is the slow step)"
adb push "${UNZIP_DIR}/." "${DEVICE_DIR}/"

# 6) Verify completeness (compare counts) and re-push any missing
DEVICE_COUNT=$(adb shell ls "${DEVICE_DIR}" | tr -d '\r' | wc -l | tr -d ' ')
if [[ "$DEVICE_COUNT" -lt "$LOCAL_COUNT" ]]; then
  echo "[sideload] push fell short: device has ${DEVICE_COUNT}/${LOCAL_COUNT} files — delta-pushing"
  comm -23 \
    <(ls "${UNZIP_DIR}" | sort) \
    <(adb shell ls "${DEVICE_DIR}" 2>/dev/null | tr -d '\r' | sort) > "${WORK_DIR}/missing.txt"
  while IFS= read -r f; do
    adb push "${UNZIP_DIR}/$f" "${DEVICE_DIR}/$f" >/dev/null
  done < "${WORK_DIR}/missing.txt"
fi

# 7) chown + SELinux relabel — required: the push happens as root but the
#    app process runs as the per-app uid (e.g. u0_a192) with per-app SELinux
#    MCS categories. Without these three steps, the native lib hits "Cannot
#    open file for mapping" or SELinux denies the read.
#
#    Important: restorecon -R does NOT reset MCS categories on already-labeled
#    files. If you're MOVING files from another app's dir (e.g. com.cactusspike.chw
#    → org.chwcompanion.app), the files keep the OLD per-uid category and
#    SELinux denies reads. chcon -R forces the new category to override.
APP_UID=$(adb shell stat -c '%u' "/data/data/${PKG}" | tr -d '\r')
APP_GID=$(adb shell stat -c '%g' "/data/data/${PKG}" | tr -d '\r')
echo "[sideload] chown -R ${APP_UID}:${APP_GID} ..."
adb shell chown -R "${APP_UID}:${APP_GID}" "${DEVICE_DIR}"
echo "[sideload] restorecon -RF ..."
adb shell restorecon -RF "${DEVICE_DIR}"
# Force MCS category to match the app's process context — restorecon won't
# rewrite existing MCS labels in all cases.
DIR_CTX=$(adb shell stat -c '%C' "/data/data/${PKG}/files" 2>/dev/null | tr -d '\r')
if [ -n "$DIR_CTX" ]; then
  echo "[sideload] chcon -R ${DIR_CTX} ..."
  adb shell chcon -R "${DIR_CTX}" "${DEVICE_DIR}"
fi

# 8) Smoke check
SIZE_MB=$(adb shell du -sm "${DEVICE_DIR}" | awk '{print $1}')
echo "[sideload] done: ${DEVICE_COUNT} files, ${SIZE_MB} MB on device"
echo "[sideload] launch the app — CactusLM will use this absolute path."
