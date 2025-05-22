import { Navigate } from 'react-router-dom'

interface Props {
  children: JSX.Element
}

const PrivateRoute = ({ children }: Props) => {
  const token = localStorage.getItem('access')
  return token ? children : <Navigate to="/" />
}

export default PrivateRoute