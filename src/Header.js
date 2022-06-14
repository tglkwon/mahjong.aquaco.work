import { useNavigate } from 'react-router-dom'

import './Header.css'

function Header() {
  const navigate = useNavigate()

  return (
    <div className="Header">
      <button >메뉴</button>
      <h1>Header</h1>
      <button onClick={navigate(`/`)}>홈</button>
    </div>
  )
}

export default Header