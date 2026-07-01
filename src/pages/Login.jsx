import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QuizMaster</h1>
          <p className="text-gray-500 mt-1">Student Login</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" placeholder="your@email.com" required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input" placeholder="••••••••" required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner size="sm" className="mx-auto" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
            </p>
            <p className="text-center text-xs text-gray-400">
              Admin?{' '}
              <Link to="/admin/login" className="text-purple-600 hover:underline">Admin login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
