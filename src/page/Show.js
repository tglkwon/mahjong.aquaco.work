import { useState, useEffect } from 'react'
import axios from 'axios'
import Item from './Item'

import './Show.css'


function Show() {
  const [ Show, setShow ] = useState([])

  useEffect(() => {
    (async () => {
      const { data } = await axios({
        method: 'GET',
        url: "https://api.mahjong.aquaco.work/score"
      })
      setShow(data)
    })()
  }, [])
      
  return (
    <table className='Show'>
      <tbody>
        <tr>
          <th>순위</th>
          <th>이름</th>
          <th>우마</th>
          <th>평우마</th>
          <th>평순위</th>
          <th>1위율</th>
          <th>연대율</th>
          <th>4위율</th>
          <th>1위</th>
          <th>2위</th>
          <th>3위</th>
          <th>4위</th>
          <th>국수</th>
        </tr>
        {Show.map(o => {
          return (<Item item={o} key={o.resourceId}/>)
        })}
      </tbody>
    </table>
  )
}

export default Show