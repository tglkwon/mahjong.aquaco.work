import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [ id, setId ] = useState("")
  const [ password, setPassword ] = useState("")
  
  async function loginAxios() {
    const { data } = await axios({
      method: 'POST',
      url: "http://api.mahjong.aquaco.work/member/login",
      data: {
        email: id,
        password: password    
      }
    })
    if (data.success) {
      localStorage.setItem("token", data.token)
      navigate(`/score`)
    }
  }

  return (
    <div className='login'>
      <div className='input'>
        <input className='id' type='text' value={id} onChange={event => {setId(event.target.value)}} placeholder='Email'></input>
        <input className='password' type='password' value={password} onChange={event => {setPassword(event.target.value)}} placeholder='Password'></input>
      </div>
      <button onClick={loginAxios}>로그인</button>
    </div>
  )
}

export default Login