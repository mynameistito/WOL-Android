# WakeOnLan for Android

> Still very WIP

> Wake your PC from anywhere on your local network with a single tap.

A React Native app that sends [Wake-on-LAN](https://en.wikipedia.org/wiki/Wake-on-LAN) magic packets over UDP, with a home screen widget for instant one-tap access.

---

## Features

- **Send magic packets** — broadcasts a 102-byte WoL packet to wake any device on your LAN
- **Home screen widget** — Android 7+ widget for one-tap wake without opening the app
- **Device configuration** — save name, MAC address, broadcast address, port, and optional IP
- **Dual storage** — AsyncStorage for the app UI; SharedPreferences for the widget (via `react-native-default-preference`)
- **MAC validation** — validates and normalizes MAC addresses to `AA:BB:CC:DD:EE:FF` format

---

## Screenshots

> _Screenshots coming soon._

---

## Requirements

| Tool         | Version       |
| ------------ | ------------- |
| Node.js      | >= 22.11.0    |
| React Native | 0.84          |
| React        | 19            |
| Android      | 7.0+ (API 24) |

---

## Getting Started

### Prerequisites

Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) for Android development.

**Note:** This project uses [Bun](https://bun.sh) as the package manager. Install it first:

```bash
# macOS/Linux/WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
irm bun.sh/install.ps1 | iex
```

### Installation

```bash
git clone https://github.com/mynameistito/WOL-Android.git
cd WOL-Android
bun install
```

### Running on Android

```bash
bun run android
```

Or start Metro separately and connect from Android Studio:

```bash
bun start
```

---

## Project Structure

```text
src/
├── components/
│   ├── device-form.tsx       # Input fields for device configuration
│   ├── status-indicator.tsx  # Color-coded status feedback (sending / success / error)
│   └── wake-button.tsx       # Primary wake action button with loading state
├── screens/
│   └── wake-on-lan-screen.tsx  # Main screen — orchestrates config, validation, sending
└── utils/
    ├── magic-packet.ts  # Builds the 102-byte WoL magic packet
    ├── storage.ts       # AsyncStorage + SharedPreferences persistence
    └── udp-send.ts      # UDP socket logic for sending the packet
```

---

## Android Widget

The home screen widget (`android/app/src/main/java/com/wakeonlan/WolWidget.kt`) reads device config from SharedPreferences (written by the app on every save) and sends a magic packet directly when tapped — no need to open the app.

**Requirements:**

- Android 7.0+ (API 24)
- The app must be installed and the device config saved at least once before the widget works

---

## Development

### Linting & Formatting

This project uses [Ultracite](https://github.com/haydenbleasel/ultracite) (powered by Biome):

```bash
bun run check   # Check for issues
bun run fix     # Auto-fix issues
```

### Versioning

Versioning is managed with [Changesets](https://github.com/changesets/changesets):

```bash
bun run changeset   # Create a new changeset
bun run version     # Bump versions and update CHANGELOG
```

### Testing

```bash
bun run test
```

---

## Building a Release APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

For a signed release build, configure your keystore in `android/app/build.gradle` and `android/gradle.properties`.

---

## Contributing

1. Fork the repo and create a feature branch
2. Make your changes and run `bun run check` to ensure lint passes
3. Add a changeset: `bun run changeset`
4. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
