import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function Register() {
  const [form, setForm] = useState({ name: '', class_name: '', generation: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(e2 => ({ ...e2, [e.target.name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome to QuizMaster!');
      navigate('/dashboard');
    } else {
      if (result.errors) setErrors(result.errors);
      else toast.error(result.error);
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
          <p className="text-gray-500 mt-1">Student Registration</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Class</label>
                <input name="class_name" type="text" value={form.class_name} onChange={handleChange}
                  className={`input ${errors.class_name ? 'border-red-400' : ''}`} placeholder="e.g. 10A" />
                {errors.class_name && <p className="text-red-500 text-xs mt-1">{errors.class_name[0]}</p>}
              </div>
              <div>
                <label className="label">Generation</label>
                <input name="generation" type="text" value={form.generation} onChange={handleChange}
                  className={`input ${errors.generation ? 'border-red-400' : ''}`} placeholder="e.g. 2025" />
                {errors.generation && <p className="text-red-500 text-xs mt-1">{errors.generation[0]}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className={`input ${errors.email ? 'border-red-400' : ''}`} placeholder="john@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className={`input ${errors.password ? 'border-red-400' : ''}`} placeholder="Min. 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange}
                className="input" placeholder="Repeat password" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? <Spinner size="sm" className="mx-auto" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
