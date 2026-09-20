#!/usr/bin/env bash
# ============================================================
#  BLADE RAID 안드로이드 APK 빌드 (Gradle 없이 SDK 도구만 사용)
#   필요 : JDK, Android SDK (platforms;android-34, build-tools;34.0.0)
#   결과 : dist/BladeRaid.apk
# ============================================================
set -euo pipefail

SDK="${ANDROID_HOME:-/c/android-sdk}"
BT="$SDK/build-tools/34.0.0"
JAR="$SDK/platforms/android-34/android.jar"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
OUT="$HERE/build"
DIST="$ROOT/dist"
KEY="$HERE/release.keystore"
KEY_PASS="${BLADERAID_KEY_PASS:-bladeraid}"

rm -rf "$OUT"; mkdir -p "$OUT/res" "$OUT/classes" "$OUT/dex" "$OUT/assets/www" "$DIST"

echo "[1/6] 게임 파일을 assets 에 복사"
cp "$ROOT/index.html" "$ROOT/manifest.json" "$OUT/assets/www/"
cp -r "$ROOT/js" "$ROOT/icons" "$ROOT/fonts" "$OUT/assets/www/"
# 앱 안에서는 서비스 워커가 필요 없음 (파일이 이미 기기에 있음)

echo "[2/6] 리소스 컴파일"
"$BT/aapt2.exe" compile --dir "$HERE/res" -o "$OUT/res.zip"

echo "[3/6] 리소스 링크 + 매니페스트"
"$BT/aapt2.exe" link -o "$OUT/base.apk" \
  -I "$JAR" \
  --manifest "$HERE/AndroidManifest.xml" \
  --java "$OUT/gen" \
  --min-sdk-version 23 --target-sdk-version 34 \
  --version-code 2 --version-name 2.0 \
  "$OUT/res.zip"

echo "[4/6] 자바 컴파일 → DEX"
# 경로에 공백이 있어도 되도록 : 윈도우 경로(슬래시)로 바꾸고 따옴표로 감싼다
find "$HERE/src" "$OUT/gen" -name '*.java' | while read -r f; do printf '"%s"\n' "$(cygpath -m "$f")"; done > "$OUT/sources.txt"
javac --release 11 -encoding UTF-8 -classpath "$JAR" -d "$OUT/classes" @"$OUT/sources.txt"
(cd "$OUT/classes" && "$BT/d8.bat" --release --min-api 23 --lib "$(cygpath -m "$JAR")" --output "$(cygpath -m "$OUT/dex")" $(find . -name '*.class'))

echo "[5/6] DEX + 에셋 합치기 + 정렬"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && jar uf "$OUT/unsigned.apk" classes.dex)
# 에셋은 jar 로 직접 넣는다 (aapt2 -A 는 윈도우에서 역슬래시 경로를 만들어 안드로이드가 못 읽음)
(cd "$OUT" && jar uf "$OUT/unsigned.apk" assets)
"$BT/zipalign.exe" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

echo "[6/6] 서명"
if [ ! -f "$KEY" ]; then
  keytool -genkeypair -keystore "$KEY" -alias bladeraid -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KEY_PASS" -keypass "$KEY_PASS" \
    -dname "CN=BLADE RAID, OU=Game, O=BladeRaid, L=Seoul, C=KR" >/dev/null 2>&1
fi
"$BT/apksigner.bat" sign --ks "$KEY" --ks-key-alias bladeraid \
  --ks-pass "pass:$KEY_PASS" --key-pass "pass:$KEY_PASS" \
  --out "$DIST/BladeRaid.apk" "$OUT/aligned.apk"
"$BT/apksigner.bat" verify "$DIST/BladeRaid.apk"

echo "완료 : $DIST/BladeRaid.apk ($(du -h "$DIST/BladeRaid.apk" | cut -f1))"
