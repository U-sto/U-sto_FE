const SESSION_KEY = 'usto_signup_session'

export type SignupSessionData = {
  userId: string
  isUserIdVerified: boolean
  emailId: string
  isEmailVerified: boolean
  password: string
  completed: boolean
}

function defaultSession(): SignupSessionData {
  return {
    userId: '',
    isUserIdVerified: false,
    emailId: '',
    isEmailVerified: false,
    password: '',
    completed: false,
  }
}

export function loadSignupSession(): SignupSessionData {
  if (typeof sessionStorage === 'undefined') return defaultSession()
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return defaultSession()
    return { ...defaultSession(), ...(JSON.parse(raw) as Partial<SignupSessionData>) }
  } catch {
    return defaultSession()
  }
}

export function saveSignupSession(partial: Partial<SignupSessionData>): SignupSessionData {
  const next = { ...loadSignupSession(), ...partial }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
  }
  return next
}

export function clearSignupSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

export function canAccessSignupStep(step: 1 | 2 | 3): boolean {
  const session = loadSignupSession()
  if (step === 1) return !session.completed
  if (step === 2) return session.isUserIdVerified && Boolean(session.userId.trim())
  if (step === 3) {
    return (
      session.isUserIdVerified &&
      Boolean(session.userId.trim()) &&
      session.isEmailVerified &&
      Boolean(session.emailId.trim()) &&
      Boolean(session.password)
    )
  }
  return false
}

export function canAccessSignupComplete(): boolean {
  return loadSignupSession().completed
}

/** 인증번호 발송 전 세션에 필요한 exists API를 다시 호출하기 위한 값 */
export function getSignupPrerequisiteIds(): { userId: string; emailId: string } {
  const session = loadSignupSession()
  return {
    userId: session.userId.trim(),
    emailId: session.emailId.trim(),
  }
}
