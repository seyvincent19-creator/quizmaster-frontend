import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { to: '/admin/questions', label: 'Questions', icon: '❓' },
  { to: '/admin/users', label: 'Students', icon: '🎓' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <div>
              <p className="font-bold text-white">QuizMaster</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-3">
            <p className="text-sm font-medium text-white">{admin?.name}</p>
            <p className="text-xs text-gray-400">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
