import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

import './Write.css'

function Write() {
  const navigate = useNavigate()
  const [ email, setEmail ] = useState("")
  const [ password, setPassword ] = useState("")
  const [ title, setTitle ] = useState("")
  const [ contents, setContents] = useState("")


  async function writeAxios() {
    const { data } = await axios({
      method: 'POST',
      url: "http://api.mahjong.aquaco.work/score",
      data: {
        author: email,
        password: password,
        title: title,
        contents: contents     
      }
    })
    if (data.success) {
      // navigate(`/`)
    }
  }

  return (
    <div className="Write">
      <div className='author'>
        <input className='email' type='text' value={email} onChange={event => {setEmail(event.target.value)}} placeholder='email'></input>
        <input className='password' type='password' value={password} onChange={event => {setPassword(event.target.value)}} placeholder='Password'></input>
        <input className='title' type='text' value={title} onChange={event => {setTitle(event.target.value)}} placeholder='Title'></input>  
      </div>
    </div>
  )
}

export default Write