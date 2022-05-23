import { Route, Routes } from 'react-router-dom'

import Show from './page/Show'
import Score from './page/Score'

import './Main.css'

function Main() {
  return (
    <Routes>
      <Route path='/' element={<Show />} />
      <Route path='/Score' element={<Score />}  />
    </Routes>
  )
}

export default Main