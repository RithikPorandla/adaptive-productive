#!/bin/bash
# Setup desktop/display access for headless environments (Cursor cloud, CI, etc.)
# Enables GUI apps, emulators, and browser automation to run.

set -e

echo "Setting up desktop access..."

# Install Xvfb and related tools if available (may need sudo)
if command -v apt-get &>/dev/null; then
  sudo apt-get update -qq 2>/dev/null || true
  sudo apt-get install -y -qq xvfb x11-utils 2>/dev/null || true
fi

# Start Xvfb on display :99 if not already running
if ! pgrep -x Xvfb &>/dev/null; then
  Xvfb :99 -screen 0 1920x1080x24 -ac 2>/dev/null &
  sleep 2
fi

export DISPLAY=:99

# Verify (xdpyinfo may show warnings but still work)
if xdpyinfo -display :99 2>/dev/null | grep -q "name of display"; then
  echo "✓ Display :99 is ready. GUI apps can use DISPLAY=:99"
else
  echo "⚠ Xvfb may not be running. Set DISPLAY=:99 and run: Xvfb :99 -screen 0 1920x1080x24 -ac &"
fi
