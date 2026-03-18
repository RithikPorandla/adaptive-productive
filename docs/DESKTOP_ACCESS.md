# Desktop Access Setup

This document explains how desktop/display access is configured so the development environment (and AI agents) can run GUI apps, emulators, and browser previews.

## Why This Matters

- **Mobile app preview**: React Native / Expo can run in a browser or emulator
- **Visual testing**: QA can take screenshots of the UI
- **Computer use**: Cursor's agent can control the desktop when enabled

## Configuration

### 1. `.cursor/environment.json`

We use a **minimal** environment config that:

- **Avoids Dockerfile/snapshot** – Cursor's "computer use" (desktop control) is disabled when you use a custom Dockerfile or snapshot. We keep it enabled.
- **Sets `DISPLAY=:99`** – Tells GUI apps to use the virtual display
- **Starts Xvfb** – Virtual framebuffer so apps can render without a physical monitor

### 2. Manual Setup (if needed)

If Xvfb isn't available in your environment, run:

```bash
./scripts/setup-desktop.sh
```

Or manually:

```bash
# Install (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y xvfb x11-utils

# Start virtual display
Xvfb :99 -screen 0 1920x1080x24 -ac &
export DISPLAY=:99
```

### 3. Running GUI Apps

```bash
export DISPLAY=:99
# Then run your app, e.g.:
# npm run web          # Expo web
# npx playwright test  # Browser tests
```

## Cursor Computer Use

Cursor cloud agents can control desktops and browsers when:

- No custom Dockerfile is used in `.cursor/environment.json`
- No snapshot is configured
- You're on a plan that supports computer use

Configure via [cursor.com/onboard](https://cursor.com/onboard) or your team settings.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot open display` | Run `Xvfb :99 -screen 0 1920x1080x24 -ac &` and `export DISPLAY=:99` |
| Xvfb not installed | Run `./scripts/setup-desktop.sh` or install via apt |
| Computer use disabled | Remove Dockerfile/snapshot from `.cursor/environment.json` |
