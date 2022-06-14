import { BrowserRouter } from 'react-router-dom'

import './App.css'
import Header from './Header'
import Main from './Main'
import Footer from './Footer'
import Sidebar from './Sidebar'

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <Header />
        <Main />
        <Footer />
      </BrowserRouter>
    </div>
  )
}

export default App