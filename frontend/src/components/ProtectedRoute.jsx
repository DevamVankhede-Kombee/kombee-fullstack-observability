import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import Layout from './Layout';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
