#!/usr/bin/env bash
# ============================================================
#  BLADE RAID 구글 플레이용 AAB 빌드 (Gradle 없이 SDK 도구 + bundletool)
#   필요 : JDK, Android SDK build-tools 34.0.0,
#          platforms;android-$TARGET_SDK  (sdkmanager 로 설치),
#          bundletool.jar  (BUNDLETOOL 환경변수 또는 android/tools/bundletool.jar)
#   서명 : 업로드 키 android/upload.keystore (git 에 올리지 않음, 비밀번호는 환경변수)
#          BLADERAID_UPLOAD_PASS 가 없으면 중단한다.
#   결과 : dist/BladeRaid.aab
# ============================================================
set -euo pipefail

SDK="${ANDROID_HOME:-/c/android-sdk}"
TARGET_SDK="${TARGET_SDK:-35}"
VERSION_CODE="${VERSION_CODE:-20}"
VERSION_NAME="${VERSION_NAME:-3.16}"
BT="$SDK/build-tools/34.0.0"
JAR="$SDK/platforms/android-$TARGET_SDK/android.jar"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
OUT="$HERE/build_aab"
DIST="$ROOT/dist"
BUNDLETOOL="${BUNDLETOOL:-$HERE/tools/bundletool.jar}"
UPLOAD_KEY="${UPLOAD_KEYSTORE:-$HERE/upload.keystore}"

[ -f "$JAR" ]        || { echo "android-$TARGET_SDK 플랫폼이 없다 : sdkmanager \"platforms;android-$TARGET_SDK\""; exit 1; }
[ -f "$BUNDLETOOL" ] || { echo "bundletool.jar 가 없다 : $BUNDLETOOL"; exit 1; }
[ -f "$UPLOAD_KEY" ] || { echo "업로드 키가 없다 : keytool -genkeypair -keystore android/upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000"; exit 1; }
: "${BLADERAID_UPLOAD_PASS:?BLADERAID_UPLOAD_PASS 환경변수에 업로드 키 비밀번호를 넣어라}"

rm -rf "$OUT"; mkdir -p "$OUT/res" "$OUT/classes" "$OUT/dex" "$OUT/base/manifest" "$OUT/base/dex" "$OUT/base/assets/www" "$DIST"

echo "[1/6] 게임 파일 복사"
cp "$ROOT/index.html" "$ROOT/manifest.json" "$OUT/base/assets/www/"
cp -r "$ROOT/js" "$ROOT/icons" "$ROOT/fonts" "$ROOT/img" "$OUT/base/assets/www/"

echo "[2/6] 리소스 컴파일"
"$BT/aapt2.exe" compile --dir "$HERE/res" -o "$OUT/res.zip"

echo "[3/6] 리소스 링크 (proto 형식 : AAB 용)"
"$BT/aapt2.exe" link --proto-format -o "$OUT/base_proto.apk" \
  -I "$JAR" --manifest "$HERE/AndroidManifest.xml" --java "$OUT/gen" \
  --min-sdk-version 23 --target-sdk-version "$TARGET_SDK" \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  --auto-add-overlay "$OUT/res.zip"

echo "[4/6] 자바 컴파일 → DEX"
find "$HERE/src" "$OUT/gen" -name '*.java' | while read -r f; do printf '"%s"\n' "$(cygpath -m "$f")"; done > "$OUT/sources.txt"
javac --release 11 -encoding UTF-8 -classpath "$JAR" -d "$OUT/classes" @"$OUT/sources.txt"
(cd "$OUT/classes" && "$BT/d8.bat" --release --min-api 23 --lib "$(cygpath -m "$JAR")" --output "$(cygpath -m "$OUT/dex")" $(find . -name '*.class'))
cp "$OUT/dex/classes.dex" "$OUT/base/dex/classes.dex"

echo "[5/6] 베이스 모듈 zip + AAB"
# proto APK 안의 manifest / resources.pb / res 를 AAB 베이스 모듈 구조로 옮긴다
( cd "$OUT" && mkdir proto && cd proto && jar xf "$OUT/base_proto.apk" )
cp "$OUT/proto/AndroidManifest.xml" "$OUT/base/manifest/AndroidManifest.xml"
cp "$OUT/proto/resources.pb" "$OUT/base/resources.pb"
[ -d "$OUT/proto/res" ] && cp -r "$OUT/proto/res" "$OUT/base/res"
( cd "$OUT/base" && jar cMf "$OUT/base.zip" . )
java -jar "$BUNDLETOOL" build-bundle --modules="$(cygpath -m "$OUT/base.zip")" --output="$(cygpath -m "$OUT/unsigned.aab")" --overwrite

echo "[6/6] 업로드 키로 서명"
cp "$OUT/unsigned.aab" "$DIST/BladeRaid.aab"
jarsigner -keystore "$UPLOAD_KEY" -storepass "$BLADERAID_UPLOAD_PASS" -sigalg SHA256withRSA -digestalg SHA-256 "$DIST/BladeRaid.aab" upload
jarsigner -verify "$DIST/BladeRaid.aab" | head -1
echo "완료 : $DIST/BladeRaid.aab ($(du -h "$DIST/BladeRaid.aab" | cut -f1))"
