import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

import './Login.css'

function Register() {
  const navigate = useNavigate()
  const [ id, setId ] = useState("")
  const [ password, setPassword ] = useState("")
  const [ nickname, setNickname ] = useState("")
  
  async function registerAxios() {
    const { data } = await axios({
      method: 'POST',
      url: "http://api.mahjong.aquaco.work/member/",
      data: {
        email: id,
        password: password,
        nickname    
      }
    })
    if (data.success) {
      navigate(`/login`)
    }
  }

  return (
    <div className='register'>
      <div className='input'>
        <input className='id' type='text' value={id} onChange={event => {setId(event.target.value)}} placeholder='Email'></input>
        <input className='password' type='password' value={password} onChange={event => {setPassword(event.target.value)}} placeholder='Password'></input>
        <input className='nickname' type='text' value={nickname} onChange={event => {setNickname(event.target.value)}} placeholder='Nickname'></input>
      </div>
      <button onClick={registerAxios}>회원가입</button>
    </div>
  )
}

export default Register