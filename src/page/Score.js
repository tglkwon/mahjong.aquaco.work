import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

import './Write.css'

function Write() {
  const navigate = useNavigate()
  const [ email, setEmail ] = useState("")
  const [ password, setPassword ] = useState("")
  const [ namePlayer1, setNamePlayer1 ] = useState("")
  const [ namePlayer2, setNamePlayer2 ] = useState("")
  const [ namePlayer3, setNamePlayer3 ] = useState("")
  const [ namePlayer4, setNamePlayer4 ] = useState("")
  const [ scorePlayer1, setScorePlayer1 ] = useState("")
  const [ scorePlayer2, setScorePlayer2 ] = useState("")
  const [ scorePlayer3, setScorePlayer3 ] = useState("")
  const [ scorePlayer4, setScorePlayer4 ] = useState("")


  
  async function writeAxios() {
    const { data } = await axios({
      method: 'POST',
      url: "http://api.mahjong.aquaco.work/score",
      data: {
        author: email,
        password: password,
        namePlayer1: namePlayer1,
        namePlayer2: namePlayer2,
        namePlayer3: namePlayer3,
        namePlayer4: namePlayer4,
        scorePlayer1: scorePlayer1,
        scorePlayer2: scorePlayer2,
        scorePlayer3: scorePlayer3,
        scorePlayer4: scorePlayer4
      }
    })
    if (data.success) {
      // navigate(`/`)
    }
  }

  return (
    <div className="page">
      <div className='names'>

      </div>
      <div className='inputs'>
        <div className='uploadImage'>

        </div>
        <div className='inputscores'>
          <input className='scorePlayer1' type='text' value={scorePlayer1} onChange={event => {setScorePlayer1(event.target.value)}}></input>
          <input className='scorePlayer2' type='text' value={scorePlayer2} onChange={event => {setScorePlayer2(event.target.value)}}></input>
          <input className='scorePlayer3' type='text' value={scorePlayer3} onChange={event => {setScorePlayer3(event.target.value)}}></input>
          <input className='scorePlayer4' type='text' value={scorePlayer4} onChange={event => {setScorePlayer4(event.target.value)}}></input>    
        </div>
        <div className='inputnames'>
          <input className='namePlayer1' type='text' value={namePlayer1} onChange={event => {setNamePlayer1(event.target.value)}}></input>
          <input className='namePlayer2' type='text' value={namePlayer2} onChange={event => {setNamePlayer2(event.target.value)}}></input>
          <input className='namePlayer3' type='text' value={namePlayer3} onChange={event => {setNamePlayer3(event.target.value)}}></input>
          <input className='namePlayer4' type='text' value={namePlayer4} onChange={event => {setNamePlayer4(event.target.value)}}></input>
        </div>  
      </div>
    </div>
  )
}

export default Write