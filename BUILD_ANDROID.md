# Building the CivilVerify Android APK

The APK is a thin native shell (Capacitor) whose only job is to open the
live CivilVerify website full-screen. Which site it opens is set by
**`server.url`** in [`capacitor.config.json`](capacitor.config.json).

## Toolchain (already installed on this machine, all under `D:\devtools`)

Nothing is on the system PATH — each build sets these itself:

| Tool            | Location                          |
| --------------- | -------------------------------- |
| Node.js         | `C:\Program Files\nodejs`        |
| Git (portable)  | `D:\devtools\git`               |
| JDK 21          | `D:\devtools\jdk21`             |
| Android SDK     | `D:\devtools\android-sdk`       |
| Gradle cache    | `D:\devtools\gradle-home`       |

SDK packages present: `platform-tools`, `platforms;android-34`,
`build-tools;34.0.0`. Licences are pre-accepted. Capacitor is pinned to v6
to match SDK 34.

## Rebuilding the APK

### 1. Point it at the right server

Edit [`capacitor.config.json`](capacitor.config.json):

```json
{
  "appId": "com.civilverify.app",
  "appName": "CivilVerify",
  "webDir": "www",
  "server": {
    "url": "https://app1-production-5d5e.up.railway.app",
    "androidScheme": "https"
  }
}
```

The live deploy is at **https://app1-production-5d5e.up.railway.app** — that
is what the shipped APK points at.

- For the **deployed** app: use the `https://…` Railway URL with
  `"androidScheme": "https"`. No `"cleartext"` needed.
- For **local testing on the same WiFi** while `npm run dev` runs on this
  PC: `"url": "http://<this-pc-LAN-IP>:3000"` with `"cleartext": true`.
  (LAN IP changes between networks — check with `ipconfig`.)

### 2. Sync and build

Run from `D:\civilverify-ai` in PowerShell:

```powershell
$env:JAVA_HOME        = "D:\devtools\jdk21"
$env:ANDROID_HOME     = "D:\devtools\android-sdk"
$env:ANDROID_SDK_ROOT = "D:\devtools\android-sdk"
$env:GRADLE_USER_HOME = "D:\devtools\gradle-home"
$env:Path             = "C:\Program Files\nodejs;D:\devtools\git\cmd;" + $env:Path

npx cap sync android
cmd /c "D:\civilverify-ai\android\gradlew.bat assembleDebug"
```

The finished APK lands at:

```
D:\civilverify-ai\android\app\build\outputs\apk\debug\app-debug.apk
```

Copy it anywhere / send it to your phone. First build takes ~8 min
(downloads Gradle + deps once); later builds are under a minute.

## Installing on a phone

1. Copy `app-debug.apk` to the phone (USB, Google Drive, email to yourself).
2. Tap it in the phone's Files app.
3. Android will warn "install from unknown source" — allow it for your
   Files/browser app, then install.
4. Open **CivilVerify** from the app drawer.

This is a **debug** APK — fine for your own use and testing. It is signed
with the auto-generated Android debug key, not a Play Store key. For a
Play Store release build (`assembleRelease` + a real signing key), see
<https://capacitorjs.com/docs/android/deploying-to-google-play>.

## Release (signed) build — when you want one

```powershell
# one-time: create a keystore (remember the passwords you type)
& "D:\devtools\jdk21\bin\keytool.exe" -genkey -v -keystore D:\civilverify-ai\release.keystore `
  -alias civilverify -keyalg RSA -keysize 2048 -validity 10000
```

Then add a `signingConfigs` block to `android/app/build.gradle` pointing at
that keystore and run `gradlew.bat assembleRelease`. The Capacitor doc
above has the exact snippet.
