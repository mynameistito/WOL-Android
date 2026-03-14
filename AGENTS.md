# Wake-on-LAN Android

**Generated:** 2026-03-15  
**Stack:** React Native 0.84 · React 19 · TypeScript · Bun · Ultracite/Biome  
**Native:** Kotlin (Android AppWidget + UDP broadcast)

## Overview

Single-screen Wake-on-LAN utility with Android home screen widget. Sends UDP magic packets to wake network devices. No navigation library - intentionally simple architecture.

---

## Structure

```text
.
├── android/app/src/main/java/com/wakeonlan/  # Kotlin native modules (Widget, BroadcastReceiver)
├── src/
│   ├── screens/           # WakeOnLanScreen (main app)
│   ├── components/        # WakeButton, StatusIndicator, DeviceForm
│   └── utils/             # storage, magic-packet, udp-send
├── __mocks__/             # Manual mocks for native modules
├── __tests__/             # Jest tests (single file)
├── scripts/               # sync-version.ts (package.json → build.gradle)
└── .zed/                  # Zed IDE config
```

---

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add new UI component | `src/components/` | Props-driven styles at file bottom |
| Modify network logic | `src/utils/udp-send.ts`, `src/utils/magic-packet.ts` | Socket created after packet build |
| Change storage schema | `src/utils/storage.ts` | Dual write: AsyncStorage + SharedPreferences |
| Update widget UI | `android/.../WolWidget.kt` | RemoteViews patterns, click listeners |
| Add native module | `android/.../WolWidgetModule.kt` | Register in `MainApplication.kt` |
| Fix widget wake action | `android/.../WolWakeReceiver.kt` | Separate receiver with signature permission |
| Change Gradle config | `android/app/build.gradle` | Signing conditional on `keystore.properties` |
| Update CI workflow | `.github/workflows/` | Actions pinned by commit SHA |
| Add mock for native dep | `__mocks__/` | Must add to `jest.config.js` moduleNameMapper |

---

## Conventions

### Only Non-Standard Patterns

| Category | Convention |
|----------|-----------|
| **Package Manager** | Bun (not npm/yarn). Lockfile: `bun.lock` (text, not `bun.lockb`) |
| **Linter/Formatter** | Ultracite (Biome) - NO ESLint/Prettier |
| **TypeScript** | Uses `@typescript/native-preview` (v7.0.0-dev snapshot, pinned without `^`) |
| **Test Runner** | `react-test-renderer` (deprecated in React 19, requires explicit `act()` + `unmount()`) |
| **Entry File** | Lowercase `app.tsx` (not `App.tsx`) |
| **Navigation** | None - single-screen app |
| **State** | Local `useState` only - no Context/Redux/Zustand |
| **Testing** | Flat structure, no `describe` nesting, `beforeEach` must reset mock stores |

### Storage Pattern

```typescript
// Dual persistence required for Android widget interop
await DefaultPreference.setName(PREFS_GROUP);  // Must match Kotlin constant
await AsyncStorage.setItem('config', json);     // React Native layer
await DefaultPreference.set('wol_mac', mac);   // Android widget layer
```

Widget cannot read AsyncStorage - uses native SharedPreferences.

### Native Module Bridge

```typescript
// Optional chaining required - module may not exist in dev/CI
NativeModules.WolWidgetModule?.refreshWidget?.();
```

### Version Sync

Custom script syncs `package.json` version → Android `versionCode`/`versionName`:
```bash
bun run sync-version  # Runs after changeset version
```

`versionCode` formula: `major * 1_000_000 + minor * 1000 + patch`

---

## Anti-Patterns (This Project)

### Android Widget Receivers

```kotlin
// ❌ CRITICAL: Never apply signature permission to AppWidgetProvider
// System broadcasts don't hold your app's signature permission
<receiver android:name=".WolWidget" android:permission="...">  // WRONG

// ✅ Separate receivers:
// WolWidget: no permission (handles APPWIDGET_UPDATE from system)
// WolWakeReceiver: signature permission (handles ACTION_WAKE)
```

### BroadcastReceiver Lifecycle

```kotlin
// ❌ Missing finish() on early return causes process leaks
override fun onReceive(context: Context, intent: Intent) {
    if (invalidCondition) return  // WRONG - pendingResult leaks
    val pendingResult = goAsync()
    try {
        // work
    } finally {
        pendingResult.finish()  // ✅ MUST be called on EVERY path
    }
}
```

### SharedPreferences Types

```kotlin
// ❌ getInt() throws ClassCastException on string values
val port = prefs.getInt("wol_port", 9)  // WRONG

// ✅ Use getString() + toIntOrNull()
val port = prefs.getString("wol_port", "9")?.toIntOrNull() ?: 9
```

### Widget Updates

```kotlin
// ❌ SharedPreferences changes don't auto-refresh widgets
// ✅ Must call explicitly:
AppWidgetManager.getInstance(context).updateAppWidget(widgetId, views)
```

### Test Mocks

```typescript
// ❌ Returning undefined breaks reads-after-writes
mockSet: jest.fn(() => Promise.resolve(undefined))  // WRONG

// ✅ Must mutate shared store
const store: Record<string, string> = {};
mockSet: jest.fn((key, value) => {
  store[key] = value;
  return Promise.resolve();
});
```

### React Test Renderer

```typescript
// ❌ Missing act() + unmount() fails in CI
const tree = renderer.create(<App />);  // WRONG

// ✅ Required pattern:
let tree: renderer.ReactTestRenderer;
act(() => { tree = renderer.create(<App />); });
// ... tests ...
act(() => { tree.unmount(); });
```

### Network Socket Lifecycle

```typescript
// ❌ Socket created before packet build (leaks on validation failure)
const socket = dgram.createSocket('udp4');
const packet = buildMagicPacket(mac);  // throws if invalid

// ✅ Create after successful build
const packet = buildMagicPacket(mac);
const socket = dgram.createSocket('udp4');
```

---

## Commands

```bash
# Development
bun start              # Metro bundler
bun android            # Run on Android
bun test               # Jest tests
bun run check          # Ultracite lint check
bun run fix            # Ultracite auto-fix

# Build
cd android && ./gradlew assembleRelease

# Version syncing (after changeset version)
bun run sync-version
```

---

## Notes

### CI Requirements

- Every job running `bun` commands needs `oven-sh/setup-bun@v2`
- Actions pinned to commit SHAs (not version tags)
- Cache key hashes `bun.lock` (text format, not `bun.lockb`)
- Keystore injected via base64-decoded secret at release time

### Android Signing

- `keystore.properties` must exist locally for release builds
- No debug keystore fallback for release - unsigned is safer
- Windows dev machines: `git update-index --chmod=+x android/gradlew`

### Widget Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  JS Layer (React Native)                                    │
│  └─ WolWidgetModule.refreshWidget()                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Widget Infrastructure                                       │
│  ├─ WolWidget: onUpdate() → updateWidgetStatic()              │
│  └─ WolWakeReceiver: onReceive() → goAsync()                  │
│         └─ sendWakePacket() → DatagramSocket (UDP broadcast)  │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  SharedPreferences (com.wakeonlan_preferences)              │
│  Keys: wol_mac, wol_name, wol_broadcastAddress, wol_port    │
│        wol_last_woken                                        │
└──────────────────────────────────────────────────────────────┘
```

### Pre-commit Hooks

Lefthook runs `ultracite fix` on staged files. Root-level files require both patterns:

```yaml
glob:
  - "*.js"          # Root-level files
  - "**/*.js"       # Nested files
```

---

## Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

### Quick Reference

- **Format code**: `npm exec -- ultracite fix`
- **Check for issues**: `npm exec -- ultracite check`
- **Diagnose setup**: `npm exec -- ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

### Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

#### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

#### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

#### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

#### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

#### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

#### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

#### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

#### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., React Native `<Image>`) over basic elements

#### Framework-Specific Guidance

**React Native:**

- Use function components with hooks
- Follow React Native-specific patterns for navigation, storage, etc.
- Use accessibility props such as `accessibilityLabel`, `accessibilityLabelledBy`, `accessibilityRole`, and related accessibility-specific props

**React19+:**

- Use ref as a prop instead of `React.forwardRef`

---

### Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting
- `react-test-renderer` is deprecated in React 19. Use `@testing-library/react` for non-native React apps. Wrap renders in `act()` and unmount in cleanup — even simple renders fail in CI without it.

### When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use meaningful names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations

---

Most formatting and common issues are automatically fixed by Biome. Run `npm exec -- ultracite fix` before committing to ensure compliance.

---

### Documentation

- Fenced code blocks in markdown require a language specifier (e.g., ` ```text ` or ` ```typescript `). Without it, markdownlint MD040 fires. Plain ASCII diagrams should use `text`.

---

### Project-Specific Notes

#### React Native Setup

- `metro.config.cjs` uses CommonJS. The `.cjs` extension ensures Node.js treats it as CommonJS, allowing `__dirname` to work correctly. ESM's `import.meta.dirname` only works in `.mjs` files or projects with `"type": "module"`.
- Minimum Android is 7.0 (API 24), not 5.0. The widget requires API 24+.

#### Pre-commit Hooks

- Lefthook globs `**/*.js` miss root-level files. Include both `*.js` and `**/*.js` patterns.
- Use `{staged_files}` in run commands to avoid formatting unrelated files.

#### Dependency Management

- This project uses `bun.lock` (text format), not `bun.lockb`. CI cache keys must hash `bun.lock` to actually rotate when dependencies change.
- `@types/*` packages belong in `devDependencies`, not `dependencies`. They're compile-time only.
- Pin dev snapshot versions (e.g., `7.0.0-dev.20260313.1`) without `^` prefix — snapshots are mutable and can break reproducibility.

#### CI/CD

- Every job that runs `bun` commands needs `oven-sh/setup-bun@v2` step — even if other setup steps exist (e.g., android-build job needs both Java and Bun).
- Pin GitHub Actions to commit SHAs (not version tags) for immutability/security. Resolve with: `gh api repos/OWNER/REPO/commits/TAG --jq '.sha'` (uses the commits API which resolves tags to commit SHAs correctly).

#### Claude Code

- Command hooks in `.claude/settings.json` do not support `{{VALID_FILES}}` placeholder. Use project-wide commands without file arguments.