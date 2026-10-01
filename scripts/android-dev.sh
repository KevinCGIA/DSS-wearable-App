#!/usr/bin/env bash
# Starts the Android dev setup so it works on any network (home, uni, library).
#
#   npm run android:dev            # build if needed, install, start Metro
#   npm run android:dev -- --restart-emulator
#
# What it handles:
#  1. Emulator DNS: the emulator copies the Mac's DNS server when it boots and
#     never updates it, so after changing networks Firebase fails with
#     auth/network-request-failed. If DNS is stale we cold-boot the emulator,
#     which picks up the current network's DNS.
#  2. Metro: debug builds connect to localhost:8081 (see reactNativeDevServerIp
#     in android/gradle.properties), so we set up `adb reverse` for every
#     connected emulator/phone.

# No pipefail: `cmd | awk ... exit` would abort the script with SIGPIPE
set -eu

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export ANDROID_HOME="$SDK"
ADB="$SDK/platform-tools/adb"
EMULATOR="$SDK/emulator/emulator"
AVD="${ANDROID_AVD:-Pixel_4}"
METRO_PORT=8081

RESTART=false
EXPO_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --restart-emulator) RESTART=true ;;
    *) EXPO_ARGS+=("$arg") ;;
  esac
done

log() { printf '\033[1;34m[android-dev]\033[0m %s\n' "$*"; }

# Runs a command with a time limit (macOS has no `timeout`)
with_timeout() {
  local seconds=$1
  shift
  perl -e 'alarm shift; exec @ARGV' "$seconds" "$@"
}

host_dns() {
  scutil --dns 2>/dev/null | awk '/nameserver\[0\]/ { print $3; exit }'
}

emulator_serial() {
  "$ADB" devices | awk '/^emulator-[0-9]+\tdevice$/ { print $1; exit }'
}

# True when the emulator can resolve and reach a real host. Uses TCP since
# the emulator's network doesn't pass ping. Retries for up to ~2 min because
# on a cold boot the network comes up well after the emulator reports booted.
emulator_dns_works() {
  local serial=$1
  for _ in $(seq 1 12); do
    if with_timeout 8 "$ADB" -s "$serial" shell \
      'echo | toybox nc -w 4 firebase.googleapis.com 443' >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

start_emulator() {
  # A cold boot (no snapshot) makes the emulator read the Mac's current DNS.
  # Don't pass -dns-server: a list of servers breaks the emulator's Wi-Fi.
  log "Starting emulator $AVD (cold boot, DNS from current network: $(host_dns))..."
  # -gpu host: draw with the Mac's GPU. Software rendering pegs the CPU and
  # makes System UI stop responding. -no-audio / -no-boot-anim save a bit more.
  nohup "$EMULATOR" -avd "$AVD" -no-snapshot-load -gpu host \
    -no-audio -no-boot-anim \
    >/tmp/android-dev-emulator.log 2>&1 &

  "$ADB" wait-for-device
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
  log "Emulator booted."
}

stop_emulator() {
  local serial=$1
  log "Shutting down emulator $serial..."
  "$ADB" -s "$serial" emu kill >/dev/null 2>&1 || true
  while "$ADB" devices | grep -q "^$serial"; do
    sleep 1
  done
}

# ----- 1. Make sure a device is available with working DNS -----

SERIAL="$(emulator_serial || true)"
PHYSICAL="$("$ADB" devices | awk 'NR > 1 && $2 == "device" && $1 !~ /^emulator-/ { print $1; exit }')"

if [ -n "$SERIAL" ] && $RESTART; then
  stop_emulator "$SERIAL"
  SERIAL=""
fi

if [ -n "$SERIAL" ]; then
  # Airplane mode also kills networking; turn it off if it was left on
  "$ADB" -s "$SERIAL" shell cmd connectivity airplane-mode disable >/dev/null 2>&1 || true

  if ! emulator_dns_works "$SERIAL"; then
    log "Emulator can't resolve hostnames (it was probably started on another network)."
    stop_emulator "$SERIAL"
    SERIAL=""
  fi
fi

if [ -z "$SERIAL" ] && [ -z "$PHYSICAL" ]; then
  start_emulator
  SERIAL="$(emulator_serial)"

  if ! emulator_dns_works "$SERIAL"; then
    log "Warning: emulator still can't reach the internet. Check the Mac's own connection"
    log "(captive portal / uni login page?) and rerun with --restart-emulator."
  fi
fi

# ----- 2. Point every connected device at Metro on this Mac -----

for device in $("$ADB" devices | awk 'NR > 1 && $2 == "device" { print $1 }'); do
  "$ADB" -s "$device" reverse tcp:$METRO_PORT tcp:$METRO_PORT >/dev/null
  log "adb reverse set for $device -> localhost:$METRO_PORT"
done

# ----- 3. Build (incremental), install, start Metro -----

# Reuse Metro if it's already running, otherwise expo stops to ask about the port
if curl -s -m 2 "http://localhost:$METRO_PORT/status" | grep -q "packager-status:running"; then
  log "Metro is already running on port $METRO_PORT, reusing it."
  EXPO_ARGS+=("--no-bundler")
fi

# Gradle and Kotlin normally keep background daemons alive for hours after a
# build, holding 1-3 GB of RAM. On an 8 GB Mac that starves the emulator
# ("System UI isn't responding"). A single-use daemon exits after the build.
export GRADLE_OPTS="${GRADLE_OPTS:-} -Dorg.gradle.daemon=false"
# Kotlin daemons left over from earlier builds
pkill -f KotlinCompileDaemon >/dev/null 2>&1 || true

log "Running expo run:android..."
exec npx expo run:android "${EXPO_ARGS[@]+"${EXPO_ARGS[@]}"}"
