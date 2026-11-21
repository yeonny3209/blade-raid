# 구글 플레이 출시 체크리스트

## 이미 준비된 것
- [x] 패키지명 `com.bladeraid.game`, 인터넷 권한 없음 (데이터 수집 없음)
- [x] 개인정보처리방침 `privacy.html` → https://yeonny3209.github.io/blade-raid/privacy.html (푸시 후 열림)
- [x] 스토어 문구·등급·데이터 보안 답변 초안 `docs/store/listing_ko.md`
- [x] AAB 빌드 스크립트 `android/build_aab.sh` (임시 키로 빌드·bundletool 검증 완료, 기기 실행은 아직 못 해 봄)
- [x] 업로드 키·AAB 는 `.gitignore` 로 git 에서 제외

## 내가 못 하는 것 (직접 해야 함)
- [ ] Play Console 개발자 계정 만들기 (등록비 25달러, 본인 인증)
- [ ] 업로드 키 만들기 (비밀번호는 직접 정하고 안전하게 보관. 잃어버리면 복구 절차가 필요)
      `keytool -genkeypair -keystore android/upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
- [ ] Play Console 에서 앱 만들기 → 콘텐츠 등급 설문, 데이터 보안, 타깃 연령, 광고 여부 입력
- [ ] 개인 개발자 계정은 프로덕션 출시 전에 비공개 테스트(테스터 12명, 14일 연속)가 필요할 수 있음. 최신 조건은 Play Console 안내를 확인

## 빌드 전에 필요한 다운로드 (사용자 허락 필요)
- [x] SDK 플랫폼 35 설치 완료 (Play Console 이 더 높은 targetSdk 를 요구하면 `TARGET_SDK=36 bash android/build_aab.sh`)
- [x] bundletool 1.18.3 → `android/tools/bundletool.jar` (git 제외)

## 빌드 후 확인
- [ ] targetSdk 를 올리면 화면 처리 방식이 바뀌므로 실제 기기/에뮬레이터에서 전체화면·노치·가로 회전 확인
- [ ] `BLADERAID_UPLOAD_PASS=... bash android/build_aab.sh` → `dist/BladeRaid.aab`
- [ ] Play Console 내부 테스트 트랙에 업로드해서 설치·실행 확인
- [ ] 기존 GitHub APK(release.keystore 서명)와 Play 버전은 서명이 달라서 서로 덮어 설치가 안 됨. 같은 기기에서는 한쪽을 지워야 함

## 그래픽 (준비 완료)
- [x] 아이콘 512x512 : `icons/icon-512.png`
- [x] 그래픽 이미지 1024x500 : `docs/store/feature-graphic.png`
- [x] 휴대전화 스크린샷 7장 (1920x1080) : `docs/store/screenshots/` (게임 화면을 직접 캡처, 홍보 편집 없음)
