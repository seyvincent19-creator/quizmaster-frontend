import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { departmentsApi, classesApi } from '../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function Register() {
  const [form, setForm] = useState({ name: '', department_id: '', class_id: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    departmentsApi.list().then(res => setDepartments(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.department_id) {
      setClasses([]);
      return;
    }
    classesApi.list(form.department_id).then(res => setClasses(res.data.data)).catch(() => {});
  }, [form.department_id]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(e2 => ({ ...e2, [e.target.name]: null }));
  };

  const handleDepartmentChange = (e) => {
    setForm(f => ({ ...f, department_id: e.target.value, class_id: '' }));
    setErrors(e2 => ({ ...e2, department_id: null, class_id: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { department_id, ...payload } = form;
    const result = await register(payload);
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
                <label className="label">Department</label>
                <select name="department_id" value={form.department_id} onChange={handleDepartmentChange}
                  className={`input ${errors.department_id ? 'border-red-400' : ''}`}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id[0]}</p>}
              </div>
              <div>
                <label className="label">Class</label>
                <select name="class_id" value={form.class_id} onChange={handleChange} disabled={!form.department_id}
                  className={`input ${errors.class_id ? 'border-red-400' : ''}`}>
                  <option value="">{form.department_id ? 'Select class' : 'Select department first'}</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.class_id && <p className="text-red-500 text-xs mt-1">{errors.class_id[0]}</p>}
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
