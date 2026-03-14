---
"wake-on-lan": patch
---

Rename metro.config.js to metro.config.cjs for CommonJS compatibility

The previous fix attempted to use `__dirname` in `metro.config.js`, but Biome's
linter converts it back to `import.meta.dirname` for `.js` files. This causes
release builds to fail with "require is not defined in ES module scope".

By renaming to `.cjs`, we explicitly tell Node.js to treat the file as CommonJS,
which allows `require()`, `module.exports`, and `__dirname` to work correctly.
Biome preserves `__dirname` in `.cjs` files.