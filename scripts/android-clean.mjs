/**
 * Remove Android/CMake build outputs without `gradlew clean`.
 * Gradle's externalNativeBuildClean fails on Windows when codegen/jni dirs
 * were already deleted (CMake "GLOB mismatch" / missing jni).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function rm(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`removed ${rel}`);
}

const topLevel = [
  "android/app/.cxx",
  "android/app/build",
  "android/build",
];

for (const rel of topLevel) rm(rel);

function rmIfExists(abs) {
  if (!fs.existsSync(abs)) return;
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`removed ${path.relative(root, abs)}`);
}

const nm = path.join(root, "node_modules");
if (fs.existsSync(nm)) {
  for (const entry of fs.readdirSync(nm, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("@")) {
      const scopeDir = path.join(nm, entry.name);
      for (const pkg of fs.readdirSync(scopeDir, { withFileTypes: true })) {
        if (pkg.isDirectory()) {
          rmIfExists(path.join(scopeDir, pkg.name, "android", "build"));
          rmIfExists(path.join(scopeDir, pkg.name, "android", ".cxx"));
        }
      }
    } else {
      rmIfExists(path.join(nm, entry.name, "android", "build"));
      rmIfExists(path.join(nm, entry.name, "android", ".cxx"));
    }
  }
}

console.log("Android clean done. Run: pnpm android");
