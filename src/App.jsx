import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// User pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Profile from './pages/Profile';
import MyReport from './pages/MyReport';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSubjects from './pages/admin/Subjects';
import AdminQuestions from './pages/admin/Questions';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';

// Auth guards
import { UserProtectedRoute, AdminProtectedRoute, UserOrAdminProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* User routes */}
        <Route path="/dashboard" element={<UserProtectedRoute><Dashboard /></UserProtectedRoute>} />
        <Route path="/quiz/:attemptCode" element={<UserOrAdminProtectedRoute><Quiz /></UserOrAdminProtectedRoute>} />
        <Route path="/result/:attemptCode" element={<UserOrAdminProtectedRoute><Result /></UserOrAdminProtectedRoute>} />
        <Route path="/profile" element={<UserProtectedRoute><Profile /></UserProtectedRoute>} />
        <Route path="/my-report" element={<UserProtectedRoute><MyReport /></UserProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/subjects" element={<AdminProtectedRoute><AdminSubjects /></AdminProtectedRoute>} />
        <Route path="/admin/questions" element={<AdminProtectedRoute><AdminQuestions /></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
