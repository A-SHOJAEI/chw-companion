# Release runbook — APK signing + GitHub Release

How to cut a signed APK for `v0.1.0`. Do this on Day 3, not Day 4.

## Prereqs

- JDK 17 on PATH
- `ANDROID_SDK_ROOT` set
- A signing keystore (generated once, kept off the repo)

## One-time: generate the upload keystore

```
keytool -genkeypair -v \
  -keystore chw-upload.jks \
  -alias chw-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Move `chw-upload.jks` to `~/.android/keystores/chw-upload.jks`. Do
**not** check it into git.

Add to `~/.gradle/gradle.properties` (NOT to the repo):

```
CHW_UPLOAD_STORE_FILE=/Users/<you>/.android/keystores/chw-upload.jks
CHW_UPLOAD_STORE_PASSWORD=...
CHW_UPLOAD_KEY_ALIAS=chw-upload
CHW_UPLOAD_KEY_PASSWORD=...
```

## Wire the keystore into the Gradle build

In `android/app/build.gradle`, add inside `android { ... }`:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('CHW_UPLOAD_STORE_FILE')) {
            storeFile file(CHW_UPLOAD_STORE_FILE)
            storePassword CHW_UPLOAD_STORE_PASSWORD
            keyAlias CHW_UPLOAD_KEY_ALIAS
            keyPassword CHW_UPLOAD_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## Build the release APK

```
cd chw-companion/android
./gradlew clean
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (~80–100 MB).

## Smoke test the APK on a real device

```
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n org.chwcompanion.app/.MainActivity
```

Tap "Try sample visit" — confirm the app reaches "Done in Xs" and the
triage card renders. If the app launches but immediately crashes, check
ProGuard rules; cactus-react-native + nitro-modules have specific
keepers — verify they're not stripped.

## Cut the GitHub Release

```
TAG=v0.1.0
git tag $TAG
git push origin $TAG
gh release create $TAG \
  --title "CHW Companion v0.1.0 — first submission build" \
  --notes-file docs/release-notes-v0.1.0.md \
  android/app/build/outputs/apk/release/app-release.apk#chw-companion-v0.1.0.apk
```

Verify the APK is downloadable in incognito:
```
curl -sI https://github.com/<you>/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | head -3
```

Should return `302` (redirect to LFS / S3) then `200`.

## Release notes template

Create `docs/release-notes-v0.1.0.md`:

```markdown
# CHW Companion v0.1.0 — first submission build

## What's here
- Full multimodal visit flow (60s audio + 3 photos → tool call)
- WHO MCPC 2017 §3 thresholds embedded
- 4 tool schemas with zod validation
- Encrypted SQLite (SQLCipher)
- Hausa-default i18n with English toggle
- WebGPU browser fallback

## Install
1. Download `chw-companion-v0.1.0.apk` from this release.
2. Enable "Install unknown apps" for your file manager.
3. Tap the APK.
4. On first launch, weights download (~6.4 GB compressed) from Hugging Face.
   Plan for ~10 GB free on the device. To skip the download, run
   `scripts/sideload-weights.sh` from a connected laptop.

## SHA-256
`<run sha256sum on the release apk>`

## Known limitations
- Not yet field-validated. Decision support, not a diagnosis.
- WebGPU browser demo uses canned-replay JSON until a Gemma 4 ONNX bundle
  ships for WebGPU.
- See `docs/SYNC_PROTOCOL.md` for the sync handoff path that's spec'd but
  not wired in v0.1.0.

## Built with Gemma
This project is built with Gemma 4 and complies with the Gemma Terms of
Use and Prohibited Use Policy at <https://ai.google.dev/gemma/terms>.
```

## Pre-flight before the Kaggle submission

After cutting the release, verify the submission-checklist gates:

```
bash scripts/preflight.sh    # TODO write this; for now run by hand
```

Or by hand:
```
# Repo public
curl -sI https://github.com/<you>/chw-companion | head -1

# APK downloadable
curl -sI https://github.com/<you>/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | head -3

# Web demo
curl -sI https://chwcompanion.pages.dev | head -1

# Writeup gates
words=$(wc -w < docs/writeup.md)
test "$words" -le 1500 && echo "writeup ok ($words)"
grep -q "Built with Gemma" docs/writeup.md && echo "BWG ok"
```

## If a smoke test fails the day of submission

1. Don't panic. You have a 6-hour buffer (we submit at 18:00 UTC, deadline
   is 23:59 UTC).
2. Cut a `v0.1.1` with the fix; update release notes; update the
   download link in the writeup.
3. The Kaggle submission page lets you replace attachments after first
   submit until the deadline.
