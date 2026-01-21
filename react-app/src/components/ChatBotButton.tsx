import './ChatBotButton.css'

const ChatBotButton = () => {
  return (
    <button className="chatbot-button" aria-label="챗봇 열기">
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 4.17C13.5 4.17 4.17 13.5 4.17 25C4.17 30.58 6.5 35.58 10.25 39.17L4.17 45.83L11.67 42.08C15.25 44.17 19.58 45.42 24.17 45.42C35.67 45.42 45.42 36.08 45.42 25C45.42 13.5 35.67 4.17 25 4.17Z" fill="white"/>
        <path d="M14.58 18.75H35.42V21.77H14.58V18.75ZM14.58 25H29.17V28.02H14.58V25ZM14.58 31.25H26.04V34.27H14.58V31.25Z" fill="#58828E"/>
      </svg>
    </button>
  )
}

export default ChatBotButton
