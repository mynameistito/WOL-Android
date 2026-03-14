# Version Sync Script Notes

## SemVer Regex for Android

- Use `/^(\d+)\.(\d+)\.(\d+)/` (no `$` anchor) to accept prerelease versions like `1.2.3-beta.1`.
- Prerelease suffixes are preserved in `versionName` but stripped for `versionCode` calculation.
- `versionCode` must be numeric (no prerelease metadata), `versionName` keeps the full semver string.
- Rejecting prereleases would break development workflow — prerelease versions are valid for local/CI builds.
