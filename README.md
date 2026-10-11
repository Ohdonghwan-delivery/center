# 배민 기사 모니터 — 아이폰 PWA 전환본

## 실행
1. 이 폴더의 파일과 `icons` 폴더를 GitHub **새 저장소** 루트에 업로드합니다.
2. Settings → Pages → Deploy from a branch → main / (root) → Save.
3. 배포 완료 후 Safari에서 GitHub Pages URL 접속 → 공유 → 홈 화면에 추가.

## 구현 범위
- 아이폰 대응 관리자 홈/통계 화면, 기사 목록, 카카오맵 기반 실시간 기사 지도, 기존 GPS 공유 화면, 홈 화면 추가용 manifest.
- 지도/위치 공유 화면은 원본의 Supabase 설정을 유지한 코드로, 서버 RLS 및 접근권한을 **반드시** 점검한 뒤 운영하세요.
- 배민 로그인 및 자동 수집은 Windows Electron의 세션/BrowserWindow에 의존하므로 **미구현**. 기존 로그인 동작을 아이폰에서 그대로 실행할 수 없습니다.
- 관리자 홈은 HTTPS 서버에서 다음 JSON 형식으로 제공할 때 연결됩니다. 서버 구현 및 인증은 별도로 필요합니다.

```json
{"stats":{"riderCount":2,"completeCount":10,"rejectCount":1,"cancelCount":0},"riders":[{"name":"기사A","completeCount":6,"rejectCount":0,"cancelCount":0}]}
```

## 보안 및 한계
- 이 파일을 Public GitHub에 업로드하면 코드에 포함된 publishable key, 지도 앱키가 공개됩니다. 비밀키(service_role 등)를 추가하지 마세요.
- **현재 지도 화면은 기존 Supabase 공개 키로 조회하므로 기사 위치정보가 노출되지 않도록 Supabase 인증/RLS를 적용해야 합니다.** 접근권한을 제한하기 전 실제 기사 데이터를 넣거나 공개 배포하지 마세요.
- 지도 카카오 JavaScript 키는 GitHub Pages 배포 도메인을 Kakao Developers의 허용 도메인에 등록해야 합니다.
- 웹앱 GPS는 아이폰 백그라운드/화면 잠금 중 지속 전송을 보장하지 않습니다.
- API 서버는 인증/권한검사, HTTPS, CORS 허용 출처 설정이 필요합니다. 브라우저에 배민 세션 쿠키나 비밀번호를 입력하지 마세요.
