#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const version = process.argv[2];
if (!version) {
  process.stderr.write("Usage: node scripts/version-bump.mjs <version>\n");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  process.stderr.write(`Invalid version format: ${version}\n`);
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");

const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const registryPath = resolve(root, "src/registry.ts");
let registryContent = readFileSync(registryPath, "utf-8");
registryContent = registryContent.replace(
  /const VERSION = "[^"]+";/,
  `const VERSION = "${version}";`,
);
writeFileSync(registryPath, registryContent);

process.stdout.write(`Version bumped to ${version}\n`);
