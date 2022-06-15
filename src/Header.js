import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faHouse } from '@fortawesome/free-solid-svg-icons';
import './Header.css'

function Header() {
  const navigate = useNavigate()

  return (
    <div className="Header">
      <button><FontAwesomeIcon icon={faBars} /></button>
      <div>아쿠아컴퍼니의 마작기록실</div>
      <button onClick={navigate(`/`)}><FontAwesomeIcon icon={faHouse} /></button>
    </div>
  )
}

export default Header