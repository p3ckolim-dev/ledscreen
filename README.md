# LED Screen

핸드폰에서 입력한 문구를 전체 화면 가로 전광판처럼 띄우는 정적 GitHub Pages 페이지입니다.
짧은 문구는 화면 안에 맞추고, 긴 문구는 큰 글씨를 유지한 채 좌우로 스크롤됩니다.
색상과 흐르는 속도를 선택할 수 있으며, 기본 속도는 2x입니다.

## Local

```bash
npm test
npm start
```

브라우저에서 `http://localhost:4173`을 열면 됩니다.

## GitHub Pages

빌드 과정이 없습니다. GitHub 저장소의 `main` 브랜치 루트를 Pages 소스로 지정하면 `index.html`이 바로 배포됩니다.
