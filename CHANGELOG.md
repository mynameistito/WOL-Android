# WakeOnLan

## 2.0.1

### Patch Changes

- 23948f6: Fix metro.config.js ESM/CommonJS mismatch causing release build failures

  The metro.config.js file was using CommonJS syntax (require/module.exports) but
  referenced import.meta.dirname which only works in ES modules. This caused the
  release build to fail with "require is not defined in ES module scope".

  Changed import.meta.dirname to \_\_dirname to use the CommonJS-compatible approach
  for resolving the project directory.

## 2.0.0

### Major Changes

- 04e5eb5: Initial release of Wake-on-LAN Android app

  - Wake-on-LAN UDP packet sender for Android devices
  - Device management: add, edit, and delete saved devices
  - Broadcast address support for network-wide wake requests
  - Persistent storage with async-storage for saved configurations
  - Modern React Native 0.84 with React19
  - CI/CD pipeline with GitHub Actions
  - Release workflow building signed APK and AAB artifacts
  - Changesets for automated version management
  - Code quality tooling: Ultracite/Biome for linting and formatting
  - Lefthook pre-commit hooks
  - Issue templates and contributing guidelines

## 1.0.0

### Major Changes

- Initial release of WakeOnLan for Android.

  - Send Wake-on-LAN magic packets over UDP from your phone
  - Home screen widget for one-tap wake (Android 7+)
  - Save device configuration (name, MAC address, broadcast address, port, optional IP)
  - Dual storage: AsyncStorage for the app UI, SharedPreferences for the widget
  - MAC address validation and normalization (AA:BB:CC:DD:EE:FF format)
