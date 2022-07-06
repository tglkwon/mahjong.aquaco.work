import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from "react-bootstrap"
import axios from 'axios'

// import 'page/Login.css'

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
    <div className="container">
      <div className='input'>
        <input className='id' type='text' value={id} onChange={event => {setId(event.target.value)}} placeholder='Email'></input>
        <input className='password' type='password' value={password} onChange={event => {setPassword(event.target.value)}} placeholder='Password'></input>
      </div>
      <Button onClick={loginAxios}>로그인</Button>
      
      
        {/* <form className="form-signin">
          <h2 className="form-signin-heading">로그인</h2>
          <label htmlFor="inputEmail" className="sr-only">이메일</label>
          <input type="email" id="inputEmail" className="form-control" value={id} onChange={event => {setId(event.target.value)}} placeholder="이메일" required="" autoFocus=""></input>
          <label htmlFor="inputPassword" className="sr-only">비밀번호</label>
          <input type="password" id="inputPassword" className="form-control" value={password} onChange={event => {setPassword(event.target.value)}} placeholder="******" required=""></input>
          <div className="checkbox">
            <label>
              <input type="checkbox" value="remember-me"> 암호 기억하기 </input>
            </label>
          </div>
          <button onClick={loginAxios} className="btn btn-lg btn-primary btn-block" type="submit">로그인</button>
        </form>
      
      <script src="../../assets/js/ie10-viewport-bug-workaround.js"></script> */}

    </div>
  )
}

export default Login