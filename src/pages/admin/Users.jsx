import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminUsersApi, adminDepartmentsApi, adminClassesApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { SkeletonTable } from '../../components/ui/SkeletonCard';

const EMPTY_FORM = { name: '', email: '', password: '', password_confirmation: '', department_id: '', class_id: '' };

// The admin users list returns raw models (nested `school_class`), while create/edit
// responses go through UserResource (flat `class_name`/`generation`/etc). Resolve both shapes.
const getClassName = (user) => (user.class_name !== undefined ? user.class_name : user.school_class?.name);
const getYearOfStudy = (user) => (user.year_of_study !== undefined ? user.year_of_study : user.school_class?.year_of_study);
const getGeneration = (user) => (user.generation !== undefined ? user.generation : user.school_class?.generation);
const getDepartmentName = (user) => (user.department_name !== undefined ? user.department_name : user.school_class?.department?.name);
const getDepartmentId = (user) => (user.department_id !== undefined ? user.department_id : user.school_class?.department_id);

export default function Students() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [filterClasses, setFilterClasses] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  // Attempts modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsMeta, setAttemptsMeta] = useState(null);

  // Create/Edit modal
  const [formModal, setFormModal] = useState(false);   // 'create' | 'edit' | false
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formClasses, setFormClasses] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── load list ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUsersApi.list({ page, search, status: statusFilter, department_id: departmentFilter, class_id: classFilter });
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter, classFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminDepartmentsApi.list().then(r => setDepartments(r.data.data)).catch(() => {});
  }, []);

  // Filter: Class dropdown cascades from the selected Department filter
  useEffect(() => {
    if (!departmentFilter) {
      setFilterClasses([]);
      return;
    }
    adminClassesApi.list(departmentFilter).then(r => setFilterClasses(r.data.data)).catch(() => {});
  }, [departmentFilter]);

  const handleDepartmentFilterChange = (value) => {
    setDepartmentFilter(value);
    setClassFilter('');
    setPage(1);
  };

  // ── attempts modal ─────────────────────────────────────────
  const loadUserAttempts = async (user, p = 1) => {
    setSelectedUser(user);
    setAttemptsLoading(true);
    try {
      const res = await adminUsersApi.attempts(user.id, p);
      setUserAttempts(res.data.data);
      setAttemptsMeta(res.data.meta);
    } catch {
      toast.error('Failed to load attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  // ── toggle active ──────────────────────────────────────────
  const handleToggleActive = async (user) => {
    setTogglingId(user.id);
    try {
      const res = await adminUsersApi.toggleActive(user.id);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: res.data.is_active } : u));
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  // ── create / edit modal helpers ────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormClasses([]);
    setFormErrors({});
    setFormModal('create');
  };

  const openEdit = (user) => {
    const deptId = getDepartmentId(user) || '';
    setEditTarget(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      password_confirmation: '',
      department_id: deptId,
      class_id: user.class_id || '',
    });
    setFormClasses([]);
    if (deptId) {
      adminClassesApi.list(deptId).then(r => setFormClasses(r.data.data)).catch(() => {});
    }
    setFormErrors({});
    setFormModal('edit');
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormErrors(err => ({ ...err, [e.target.name]: null }));
  };

  const handleFormDepartmentChange = (e) => {
    const value = e.target.value;
    setForm(f => ({ ...f, department_id: value, class_id: '' }));
    setFormErrors(err => ({ ...err, department_id: null, class_id: null }));
    if (value) {
      adminClassesApi.list(value).then(r => setFormClasses(r.data.data)).catch(() => {});
    } else {
      setFormClasses([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFormErrors({});
    const { department_id, ...payload } = form;
    try {
      if (formModal === 'create') {
        const res = await adminUsersApi.create(payload);
        toast.success(res.data.message);
        setFormModal(false);
        setPage(1);
        load();
      } else {
        const res = await adminUsersApi.update(editTarget.id, payload);
        toast.success(res.data.message);
        setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, ...res.data.data } : u));
        setFormModal(false);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || 'Operation failed');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminUsersApi.delete(deleteTarget.id);
      toast.success(res.data.message);
      setDeleteTarget(null);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // ── render ─────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            {meta && <p className="text-gray-500 text-sm mt-1">{meta.total} total students</p>}
          </div>
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2"
            id="btn-create-student"
          >
            <span className="text-lg">+</span> Create Student
          </button>
        </div>

        {/* Filters */}
        <div className="card py-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text" placeholder="Search by name or email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input flex-1 min-w-48"
            />
            <select className="input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select className="input w-40" value={departmentFilter} onChange={e => handleDepartmentFilterChange(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="input w-36" value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }} disabled={!departmentFilter}>
              <option value="">All Classes</option>
              {filterClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? <SkeletonTable rows={8} cols={7} /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Student Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Year of Study</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Generation</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Attempts</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-gray-400">No students found.</td>
                      </tr>
                    ) : users.map((user, i) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400">{((page - 1) * 20) + i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{user.email}</td>
                        <td className="py-3 px-4 text-gray-500">{getDepartmentName(user) || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 px-4 text-gray-500">{getClassName(user) || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 px-4 text-gray-500">{getYearOfStudy(user) || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 px-4 text-gray-500">{getGeneration(user) || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => loadUserAttempts(user)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {user.quiz_attempts_count} attempts
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className={user.is_active ? 'badge badge-green' : 'badge badge-red'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(user)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            {/* Toggle */}
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={togglingId === user.id}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                user.is_active
                                  ? 'border-red-300 text-red-600 hover:bg-red-50'
                                  : 'border-green-300 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {togglingId === user.id ? <Spinner size="sm" /> : user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-red-600 hover:border-red-300 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────── */}
      <Modal
        isOpen={!!formModal}
        onClose={() => setFormModal(false)}
        title={formModal === 'create' ? '🎓 Create New Student' : `✏️ Edit Student — ${editTarget?.name}`}
        footer={
          <>
            <button onClick={() => setFormModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : formModal === 'create' ? 'Create Student' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          {/* Name */}
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input
              name="name" type="text" value={form.name} onChange={handleFormChange}
              className={`input ${formErrors.name ? 'border-red-400' : ''}`}
              placeholder="e.g. John Doe"
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input
              name="email" type="email" value={form.email} onChange={handleFormChange}
              className={`input ${formErrors.email ? 'border-red-400' : ''}`}
              placeholder="student@example.com"
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email[0]}</p>}
          </div>

          {/* Department + Class side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select
                name="department_id" value={form.department_id} onChange={handleFormDepartmentChange}
                className={`input ${formErrors.department_id ? 'border-red-400' : ''}`}
              >
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id[0]}</p>}
            </div>
            <div>
              <label className="label">Class</label>
              <select
                name="class_id" value={form.class_id} onChange={handleFormChange} disabled={!form.department_id}
                className={`input ${formErrors.class_id ? 'border-red-400' : ''}`}
              >
                <option value="">{form.department_id ? 'Select class' : 'Select department first'}</option>
                {formClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {formErrors.class_id && <p className="text-red-500 text-xs mt-1">{formErrors.class_id[0]}</p>}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">
              Password {formModal === 'edit' && <span className="text-gray-400 text-xs">(leave blank to keep current)</span>}
              {formModal === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              name="password" type="password" value={form.password} onChange={handleFormChange}
              className={`input ${formErrors.password ? 'border-red-400' : ''}`}
              placeholder="Min. 8 characters"
            />
            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">Confirm Password</label>
            <input
              name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleFormChange}
              className="input"
              placeholder="Repeat password"
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="⚠️ Delete Student"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {deleting ? <Spinner size="sm" /> : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
          <p className="text-gray-400 text-sm mt-1">
            This will permanently remove the student and all their quiz attempts.
          </p>
        </div>
      </Modal>

      {/* ── Student Attempts Modal ───────────────────────── */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Student Attempts — ${selectedUser?.name}`}
      >
        {attemptsLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userAttempts.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No attempts found.</p>
            ) : (
              userAttempts.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-xs font-mono text-gray-500">{a.attempt_code?.slice(0, 8)}…</p>
                    <p className="text-xs text-gray-400">{new Date(a.started_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{a.score}/{a.total_questions}</p>
                    <span className={a.status === 'completed' ? (a.score >= 50 ? 'badge badge-green' : 'badge badge-red') : 'badge badge-yellow'}>
                      {a.status === 'completed' ? (a.score >= 50 ? 'PASS' : 'FAIL') : 'In Progress'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
