# 공유형 수업 피드백

이 저장소에는 두 가지 흐름이 있습니다.

- `index.html`: 공개용 URL 공유 페이지
- `publisher/` + `tools/`: 짧은 URL 정적 페이지를 실제로 발행하는 로컬 발행기

## 짧은 URL 발행 방법

1. 로컬에서 `npm run publisher`를 실행합니다.
2. 브라우저에서 `http://127.0.0.1:4317` 을 엽니다.
3. 피드백 내용을 입력하고 `짧은 URL 발행`을 누릅니다.
4. 발행기가 `코딩쏙학원_[이름]_피드백/index.html` 페이지를 생성하고 git commit/push까지 수행합니다.
5. 결과 URL은 `https://procodejh.github.io/feedback-share-url/코딩쏙학원_이름_피드백/` 형태로 반환됩니다.

## 공개 페이지 구조

- 첫 페이지는 로고와 안내 문구가 보이는 표지입니다.
- 다음 버튼을 누르면 실제 피드백 내용이 열립니다.

## 관련 파일

- `tools/render-feedback-page.mjs`: 발행용 HTML 렌더러
- `tools/publish-feedback-page.mjs`: 페이지 생성 + git commit/push
- `tools/publisher-server.mjs`: 로컬 발행 서버
- `publisher/index.html`: 로컬 발행 폼

## 참고

- `vercel.json`, `_redirects`, `404.html`, `.nojekyll`은 정적 호스팅과 경로 접근을 위해 유지합니다.
