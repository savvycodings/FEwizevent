# Android builds on Windows

## The `prefab_command.bat` / CreateProcess error=2

Gradle fails to run CMake prefab scripts when:

- `node_modules` paths are very long (pnpm default layout), and/or
- **New Architecture** is enabled (`newArchEnabled=true`).

Reanimated requires **New Architecture** (`newArchEnabled=true`). This repo uses **hoisted** `node_modules` (see `.npmrc`) to shorten CMake/prefab paths on Windows.

## One-time fix after pulling these changes

Run in **PowerShell** (not Git Bash) from `app/`:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
pnpm install
pnpm android:clean
pnpm android
```

## Daily workflow

```powershell
pnpm start
# separate terminal:
pnpm android
```

Use **Expo Go** for quick JS-only iteration: `pnpm start` then press `s` until it says `Using Expo Go`, scan the QR code.

Use **`pnpm android`** when you need the full native app (charts, dev client, etc.).

## If it still fails

1. Move the repo closer to the drive root, e.g. `C:\dev\FAwizevent\app` (shorter paths).
2. In Android Studio → SDK Manager, ensure **NDK 27.1.12297006** and **CMake** are installed.
3. Set `ANDROID_HOME` to your SDK, e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`.
4. Cloud build (no local native toolchain): `npx eas build --profile development --platform android`

## `gradlew clean` / codegen jni errors

Do **not** use `gradlew clean` on this project. It runs `externalNativeBuildClean`, which re-configures CMake while `codegen/jni` folders are missing and fails with **GLOB mismatch** / **add_subdirectory ... not an existing directory**.

`pnpm android:clean` deletes `android/app/.cxx`, `android/build`, and native `node_modules/*/android/build` folders instead.

## `INSTALL_FAILED_INSUFFICIENT_STORAGE`

Gradle **BUILD SUCCESSFUL** but `adb install` fails — the **emulator is out of disk**, not your project.

Typical debug APK size is ~100MB+; install needs extra space for extraction.

**Check space (PowerShell):**

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell df -h /data
```

**Free space:** uninstall old dev builds and Expo Go on the emulator, then reinstall:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb uninstall com.knoome.wizardevent
& $adb uninstall host.exp.exponent
# optional: remove other test apps listed by:
# & $adb shell pm list packages -3
& $adb install -r -d android\app\build\outputs\apk\debug\app-debug.apk
```

If still tight: Android Studio → Device Manager → emulator **⋮** → **Wipe Data**, or create a new AVD with **8 GB+** internal storage.

After install succeeds, Metro is already running — press **`a`** in that terminal or launch the app from the emulator.

## Chart debugging

Profile rank charts use `GET /auth/rank-progress`. Server logs are prefixed with `[charts]`; Metro logs use `[Profile/chart]`. See `app/CHARTS.md`.

## Invalid flags

- `expo run:android` does **not** support `--clear-cache`.
- Use `pnpm android:clean` then `pnpm android` instead.
