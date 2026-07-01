import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAdminStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1">QuizMaster Administration</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="admin@quizmaster.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••" required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner size="sm" /> : null}
              Sign In as Admin
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/login" className="text-gray-400 hover:text-white">← Back to user login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
