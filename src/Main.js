import { Route, Routes } from 'react-router-dom'

import Show from './page/Show'
import Score from './page/Score'
import Login from './page/Login'
import Register from './page/Register'

import './Main.css'

function Main() {
  return (
    <Routes>
      <Route path='/' element={<Show />} />
      <Route path='/score' element={<Score />}  />
      <Route path='/login' element={<Login />}  />
      <Route path='/register' element={<Register />}  />
    </Routes>
  )
}

export default Main