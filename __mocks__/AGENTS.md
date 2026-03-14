# Testing Notes

## Jest Module Mocks

- `moduleNameMapper` patterns are regex. Unanchored patterns like `"react-native-udp"` match any path containing that string. Use `^...$` anchors for exact matches: `"^react-native-udp$"`.
- Mocks with `get()`/`set()`/`clear()` must mutate a shared store object. Returning `Promise.resolve(undefined)` without mutation breaks reads-after-writes.
- Export a `__resetStore()` helper from mocks with module-scoped state so tests can call it in `beforeEach` to ensure test isolation.
