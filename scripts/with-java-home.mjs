import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const candidates = [
  process.env.ANDROID_STUDIO_JBR,
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  'C:\\Program Files\\Java\\jdk-17',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.18.8-hotspot',
].filter(Boolean)

function isValidJdk(home) {
  return fs.existsSync(path.join(home, 'bin', 'java.exe'))
}

const javaHome = candidates.find(isValidJdk)
if (!javaHome) {
  console.error(
    'No valid JDK found. Install Android Studio or set ANDROID_STUDIO_JBR to a JDK folder.'
  )
  process.exit(1)
}

process.env.JAVA_HOME = javaHome

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  'C:\\Users\\user-pc\\AppData\\Local\\Android\\Sdk',
].filter(Boolean)

const androidHome = sdkCandidates.find((dir) => fs.existsSync(path.join(dir, 'platform-tools')))
if (androidHome) {
  process.env.ANDROID_HOME = androidHome
  process.env.ANDROID_SDK_ROOT = androidHome
}

console.log(`[with-java-home] JAVA_HOME=${javaHome}`)
if (androidHome) console.log(`[with-java-home] ANDROID_HOME=${androidHome}`)

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/with-java-home.mjs <command> [args...]')
  process.exit(1)
}

const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
