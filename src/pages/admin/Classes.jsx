import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminClassesApi, adminDepartmentsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const emptyForm = { name: '', department_id: '', year_of_study: '', generation: '', is_active: true };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClassesApi.list(departmentFilter || null);
      setClasses(res.data.data);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminDepartmentsApi.list().then(r => setDepartments(r.data.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditClass(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditClass(c);
    setForm({
      name: c.name,
      department_id: c.department_id,
      year_of_study: c.year_of_study || '',
      generation: c.generation || '',
      is_active: c.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});
    try {
      if (editClass) {
        await adminClassesApi.update(editClass.id, form);
        toast.success('Class updated!');
      } else {
        await adminClassesApi.create(form);
        toast.success('Class created!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
      else toast.error(err.response?.data?.message || 'Failed to save class');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminClassesApi.delete(deleteId);
      toast.success('Class deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await adminClassesApi.toggleActive(c.id);
      toast.success(`Class ${c.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFormErrors(e => ({ ...e, [key]: null }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
            {!loading && <p className="text-gray-500 text-sm mt-1">{classes.length} classes</p>}
          </div>
          <button onClick={openCreate} className="btn-primary">+ Add Class</button>
        </div>

        <div className="card py-4">
          <select className="input w-48" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏫</div>
              <p className="text-gray-500">No classes yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Year of Study</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Generation</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Students</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                      <td className="py-3 px-4 text-gray-500">{c.department?.name || '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{c.year_of_study || '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{c.generation || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{c.users_count ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={c.is_active ? 'badge badge-green' : 'badge badge-gray'}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleToggleActive(c)}
                            className="btn-secondary text-xs px-2.5 py-1"
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => openEdit(c)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                          <button onClick={() => setDeleteId(c.id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editClass ? 'Edit Class' : 'Add Class'}
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleFormSubmit} disabled={formLoading} className="btn-primary">
              {formLoading ? <Spinner size="sm" /> : editClass ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Name" error={formErrors.name}>
            <input
              value={form.name}
              onChange={e => handleField('name', e.target.value)}
              className={`input ${formErrors.name ? 'border-red-400' : ''}`}
              placeholder="e.g. CS-2A"
            />
          </FormField>
          <FormField label="Department" error={formErrors.department_id}>
            <select
              value={form.department_id}
              onChange={e => handleField('department_id', e.target.value)}
              className={`input ${formErrors.department_id ? 'border-red-400' : ''}`}
            >
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Year of Study" error={formErrors.year_of_study}>
              <input
                value={form.year_of_study}
                onChange={e => handleField('year_of_study', e.target.value)}
                className="input"
                placeholder="e.g. Year 2"
              />
            </FormField>
            <FormField label="Generation" error={formErrors.generation}>
              <input
                value={form.generation}
                onChange={e => handleField('generation', e.target.value)}
                className="input"
                placeholder="e.g. 2025"
              />
            </FormField>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="class_is_active"
              checked={form.is_active}
              onChange={e => handleField('is_active', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="class_is_active" className="text-sm text-gray-700">Active (visible to students)</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Class?"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <p className="text-gray-600">
          This will permanently delete the class. Classes with students assigned cannot be deleted — reassign or remove the students first.
        </p>
      </Modal>
    </AdminLayout>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}
