import { Navigate } from 'react-router-dom';
import { useAuthStore, useAdminStore } from '../stores/authStore';

export function UserProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminStore();
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  return children;
}

// Allows both logged-in users and logged-in admins (e.g. quiz player, result page)
export function UserOrAdminProtectedRoute({ children }) {
  const { isAuthenticated: isUser } = useAuthStore();
  const { isAuthenticated: isAdmin } = useAdminStore();
  if (!isUser() && !isAdmin()) return <Navigate to="/login" replace />;
  return children;
}
