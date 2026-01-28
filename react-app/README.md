# 대학물품관리시스템 - 로그인 페이지

Figma 디자인을 기반으로 제작된 React 로그인 페이지입니다.

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 프로젝트 구조

```
react-app/
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx      # 메인 로그인 페이지
│   │   ├── GNB.tsx            # 상단 네비게이션 바
│   │   ├── LoginForm.tsx     # 로그인 폼
│   │   ├── TextField.tsx      # 텍스트 입력 필드
│   │   ├── PasswordField.tsx  # 비밀번호 입력 필드
│   │   ├── Checkbox.tsx       # 체크박스
│   │   └── Button.tsx         # 버튼
│   ├── styles/
│   │   └── variables.css      # CSS 변수 (색상, 타이포그래피)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
└── package.json
```

## 주요 기능

- 반응형 디자인
- 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
- 비밀번호 표시/숨기기 토글
- 자동 로그인 체크박스
- 폼 유효성 검사 준비

## 디자인 시스템

### 색상
- Primary 300: `#58828E`
- Primary 200: `#C1D8DC`
- Gray 100: `#BEC3C3`
- Alt White: `#FAFBFB`

### 타이포그래피
- 폰트: Noto Sans KR
- Heading 1: 36px, Bold
- Heading 2: 32px, Bold
- Subheading 1: 24px, Bold
- Subheading 2: 24px, Medium
- Caption: 18px, Medium
