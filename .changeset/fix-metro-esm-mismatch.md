---
"wake-on-lan": patch
---

Fix metro.config.js ESM/CommonJS mismatch causing release build failures

The metro.config.js file was using CommonJS syntax (require/module.exports) but
referenced import.meta.dirname which only works in ES modules. This caused the
release build to fail with "require is not defined in ES module scope".

Changed import.meta.dirname to __dirname to use the CommonJS-compatible approach
for resolving the project directory.