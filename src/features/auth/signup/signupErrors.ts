type SignupStepHint = 1 | 2 | 3

const STEP_LABELS: Record<SignupStepHint, string> = {
  1: '1단계(아이디 중복확인)',
  2: '2단계(이메일 중복확인·인증)',
  3: '3단계(휴대폰 중복확인·인증 및 가입)',
}

function inferStepFromMessage(message: string): SignupStepHint | null {
  const normalized = message.trim()
  if (!normalized) return null

  if (/아이디|usrId|user-id|user_id/i.test(normalized) && /중복|exists|확인/i.test(normalized)) {
    return 1
  }
  if (/이메일|email/i.test(normalized)) {
    return 2
  }
  if (/sms|전화|휴대/i.test(normalized)) {
    return 3
  }
  if (/세션|session|만료|Unauthorized|401/i.test(normalized)) {
    return 1
  }
  return null
}

/**
 * 서버 세션/인증 관련 오류를 단계별 안내 문구로 변환
 */
export function mapSignupSessionError(message: string): string {
  const step = inferStepFromMessage(message)
  if (!step) return message

  const stepGuide = `${STEP_LABELS[step]}부터 다시 진행해 주세요.`
  if (message.includes(stepGuide)) return message
  return `${message}\n\n${stepGuide}`
}

export function getSignupStepRedirectPath(step: SignupStepHint): string {
  if (step === 1) return '/signup'
  if (step === 2) return '/signup/step2'
  return '/signup/step3'
}
