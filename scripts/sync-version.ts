import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;
const VERSION_CODE_REGEX = /versionCode\s+\d+/;
const VERSION_NAME_REGEX = /versionName\s+["'][^"']+["']/;

const rootDir = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(rootDir, "package.json");
const buildGradlePath = resolve(rootDir, "android/app/build.gradle");

interface PackageJson {
  version: string;
}

function parseSemver(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const match = version.match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  return {
    major: Number.parseInt(match[1] ?? "0", 10),
    minor: Number.parseInt(match[2] ?? "0", 10),
    patch: Number.parseInt(match[3] ?? "0", 10),
  };
}

function calculateVersionCode(semver: {
  major: number;
  minor: number;
  patch: number;
}): number {
  return semver.major * 1_000_000 + semver.minor * 1000 + semver.patch;
}

function syncVersions(): void {
  const packageJson: PackageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf-8")
  );
  const version = packageJson.version;

  if (!version) {
    throw new Error("No version found in package.json");
  }

  const semver = parseSemver(version);
  const versionCode = calculateVersionCode(semver);
  const versionName = version;

  let buildGradle = readFileSync(buildGradlePath, "utf-8");

  buildGradle = buildGradle.replace(
    VERSION_CODE_REGEX,
    `versionCode ${versionCode}`
  );
  buildGradle = buildGradle.replace(
    VERSION_NAME_REGEX,
    `versionName "${versionName}"`
  );

  writeFileSync(buildGradlePath, buildGradle, "utf-8");

  console.log(
    `Synced version ${versionName} (versionCode: ${versionCode}) to build.gradle`
  );
}

syncVersions();
