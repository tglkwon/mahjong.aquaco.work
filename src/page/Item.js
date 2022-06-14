import { useNavigate } from 'react-router-dom'
import './Item.css'

function Item({ item }) {
  const navigate = useNavigate()
  function goRead() {
    navigate(`/read/${item.no}`)
  }
  return (
    <tr onClick={goRead}>
      <td className='no'>{item.no}</td>
      <td className='title'>{item.title}</td>
      <td className='author'>{item.author}</td>
    </tr>
  )
}

export default Item