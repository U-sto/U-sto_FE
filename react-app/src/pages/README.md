# Pages 폴더

이 폴더에는 애플리케이션의 모든 페이지 컴포넌트가 포함되어 있습니다.

## 현재 페이지

- **LoginPage** (`/login`) - 로그인 페이지
- **SignupPage** (`/signup`) - 회원가입 1단계 (이메일 인증)
- **SignupStep2Page** (`/signup/step2`) - 회원가입 2단계 (아이디/비밀번호 설정)

## 새 페이지 추가하기

새로운 페이지를 추가하려면 다음 단계를 따르세요:

### 1. 페이지 컴포넌트 생성

`src/pages/` 폴더에 새 페이지 파일을 만듭니다.

예시: `src/pages/AboutPage.tsx`

```tsx
import GNB from '../components/GNB'
import './AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <GNB />
      <div className="about-content">
        <h1>About 페이지</h1>
        <p>페이지 내용을 여기에 작성하세요.</p>
      </div>
    </div>
  )
}

export default AboutPage
```

### 2. CSS 파일 생성

페이지에 맞는 CSS 파일을 만듭니다.

예시: `src/pages/AboutPage.css`

```css
.about-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--usto-alt-white);
  display: flex;
  flex-direction: column;
}

.about-content {
  padding: 40px 20px;
}
```

### 3. 라우트 추가

`src/App.tsx` 파일에 새 라우트를 추가합니다.

```tsx
import AboutPage from './pages/AboutPage'

// Routes 안에 추가
<Route path="/about" element={<AboutPage />} />
```

### 4. 네비게이션 추가 (선택사항)

다른 페이지로 이동하려면 `Link` 컴포넌트를 사용합니다.

```tsx
import { Link } from 'react-router-dom'

<Link to="/about">About으로 이동</Link>
```

또는 프로그래밍 방식으로:

```tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/about')
```

## 라우트 목록

- `/` - 루트 (자동으로 `/login`으로 리다이렉트)
- `/login` - 로그인 페이지
- `/signup` - 회원가입 1단계 (이메일 인증)
- `/signup/step2` - 회원가입 2단계 (아이디/비밀번호 설정)

## 공통 컴포넌트

모든 페이지는 필요에 따라 다음 공통 컴포넌트를 사용할 수 있습니다:

- `GNB` - 상단 네비게이션 바
- `Button` - 버튼 컴포넌트
- `TextField` - 텍스트 입력 필드
- `PasswordField` - 비밀번호 입력 필드
- `Checkbox` - 체크박스
- `ProgressBar` - 진행 바
- `EmailAuthField` - 이메일 인증 필드
- `IDCheckField` - 아이디 중복확인 필드
