import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import ProgressBar from '../../components/ProgressBar'
import TextField from '../../components/TextField'
import Dropdown from '../../components/Dropdown'
import PhoneAuthField from '../../components/PhoneAuthField'
import Button from '../../components/Button'
import './SignupStep3Page.css'

const SignupStep3Page = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')

  const departments = [
    // 한글 항목 (가나다 순)
    '강소연구개발특구지원단',
    '경상대학',
    '경상대학RC',
    '공학대학',
    '공학대학RC',
    '교무처',
    '교책연구센터',
    '교육혁신처',
    '국제교육원',
    '국제처',
    '기획처',
    '기타부설기관',
    '대외협력실',
    '디자인대학',
    '디자인대학RC',
    '미래인재양성단',
    '부설교육기관',
    '부설연구소',
    '산학연협력단지사업단',
    '산학협력기관',
    '사회봉사단',
    '사회교육원(ERICA)',
    '소프트웨어융합대학',
    '소프트웨어융합대학RC',
    '약학대학',
    '약학대학RC',
    '예체능대학',
    '예체능대학RC',
    '외부지정연구센터',
    '입학처',
    '인권센터',
    '융합산업대학원',
    '융합산업대학원RC',
    '창의융합교육원',
    '창의인재원',
    '창업지원단',
    '총무관리처',
    '캠퍼스혁신파크 사업단',
    '커뮤니케이션&컬처대학',
    '커뮤니케이션&컬처대학RC',
    '한대방송국',
    '한양AI융합연구원',
    '한양국방연구원(ERICA)',
    '한양맞춤의약연구원',
    '한양환경에너지기술연구원',
    '학술연구처',
    '학생군사교육단',
    '학생인재개발처',
    '조기취업형계약학과 선도대학육성사업단',
    '지능형로봇사업단',
    '(일반)대학원',
    '첨단융합대학',
    '첨단융합대학RC',
    '글로벌문화통상대학',
    '글로벌문화통상대학RC',
    // 영어 항목 (맨 아래)
    'ERICA기술지주회사',
    'ERICA산학협력단',
    'ERICA융합원',
    'ERICA학술정보관',
    'LIONS칼리지',
    'LIONS칼리지RC',
    'RISE지산학협력단',
    'SW-AI융합교육원',
  ]

  const handleSendCode = () => {
    console.log('인증번호 전송:', phone)
    // 여기에 인증번호 전송 로직을 추가하세요
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('회원가입:', { name, department, phone, authCode })
    // 여기에 회원가입 로직을 추가하세요
    // 회원가입 성공 시 완료 페이지로 이동
    navigate('/signup/complete')
  }

  return (
    <div className="signup-step3-page">
      <GNB />
      <div className="signup-step3-wrapper">
        <h1 className="signup-step3-title">회원가입</h1>
        <ProgressBar step={3} />
        
        <form className="signup-step3-form" onSubmit={handleSignup}>
          <div className="signup-step3-fields">
            <TextField
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            <Dropdown
              placeholder="소속"
              value={department}
              onChange={setDepartment}
              options={departments}
            />
            
            <div className="phone-auth-section">
              <PhoneAuthField
                phone={phone}
                onPhoneChange={(e) => setPhone(e.target.value)}
                onSendCode={handleSendCode}
              />
              
              <TextField
                placeholder="인증번호를 입력해 주세요"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
              />
            </div>
          </div>
          
          <div className="signup-step3-bottom">
            <Button type="submit">가입하기</Button>
            <div className="signup-step3-footer">
              <Link to="/login" className="signup-step3-link">기존 계정 로그인</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupStep3Page
