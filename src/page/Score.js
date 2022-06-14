import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

import './Score.css'

function Score() {
  const token = localStorage.getItem("token")
  const navigate = useNavigate()
  const [ namePlayer1, setNamePlayer1 ] = useState("")
  const [ namePlayer2, setNamePlayer2 ] = useState("")
  const [ namePlayer3, setNamePlayer3 ] = useState("")
  const [ namePlayer4, setNamePlayer4 ] = useState("")
  const [ scorePlayer1, setScorePlayer1 ] = useState("")
  const [ scorePlayer2, setScorePlayer2 ] = useState("")
  const [ scorePlayer3, setScorePlayer3 ] = useState("")
  const [ scorePlayer4, setScorePlayer4 ] = useState("")
  
  async function scoreAxios() {
    const { data } = await axios({
      method: 'POST',
      url: "http://api.mahjong.aquaco.work/score",
      headers: {
        token
      },
      data: {
        players: {
          player1: {
            nickname: namePlayer1,
            score: scorePlayer1
            // wind
          },
          player2: {
            nickname: namePlayer2,
            score: scorePlayer2
            // wind
          },
          player3: {
            nickname: namePlayer3,
            score: scorePlayer3
            // wind
          },
          player4: {
            nickname: namePlayer4,
            score: scorePlayer4
            //  wind
          },
        }
      }
    })
    if (data.success) {
      navigate(`/`)
    }
  }

  return (
    <div className="page">
      <div className='names'>
        닉네임 선택존
      </div>
      <div className='inputs'>
        <div className='uploadImage'>
          이미지 업로드
        </div>
        <div className='inputScores'>
          <input className='scorePlayer1' type='text' value={scorePlayer1} onChange={event => {setScorePlayer1(event.target.value)}}></input>
          <input className='scorePlayer2' type='text' value={scorePlayer2} onChange={event => {setScorePlayer2(event.target.value)}}></input>
          <input className='scorePlayer3' type='text' value={scorePlayer3} onChange={event => {setScorePlayer3(event.target.value)}}></input>
          <input className='scorePlayer4' type='text' value={scorePlayer4} onChange={event => {setScorePlayer4(event.target.value)}}></input>    
        </div>
        <div className='inputNames'>
          <input className='namePlayer1' type='text' value={namePlayer1} onChange={event => {setNamePlayer1(event.target.value)}}></input>
          <input className='namePlayer2' type='text' value={namePlayer2} onChange={event => {setNamePlayer2(event.target.value)}}></input>
          <input className='namePlayer3' type='text' value={namePlayer3} onChange={event => {setNamePlayer3(event.target.value)}}></input>
          <input className='namePlayer4' type='text' value={namePlayer4} onChange={event => {setNamePlayer4(event.target.value)}}></input>
        </div>  
        <div className='winds'>
          <input type='radio' name="wind">동</input>
          <input type='radio' name="wind">남</input>
          <input type='radio' name="wind">서</input>
          <input type='radio' name="wind">북</input>
        </div>
        <button onClick={scoreAxios}>제출</button>
      </div>
    </div>
  )
}

export default Score