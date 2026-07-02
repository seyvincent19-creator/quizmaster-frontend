import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminDepartmentsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const emptyForm = { name: '', description: '', is_active: true };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminDepartmentsApi.list();
      setDepartments(res.data.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditDepartment(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (d) => {
    setEditDepartment(d);
    setForm({ name: d.name, description: d.description || '', is_active: d.is_active });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});
    try {
      if (editDepartment) {
        await adminDepartmentsApi.update(editDepartment.id, form);
        toast.success('Department updated!');
      } else {
        await adminDepartmentsApi.create(form);
        toast.success('Department created!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
      else toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminDepartmentsApi.delete(deleteId);
      toast.success('Department deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (department) => {
    try {
      await adminDepartmentsApi.toggleActive(department.id);
      toast.success(`Department ${department.is_active ? 'deactivated' : 'activated'}`);
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
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            {!loading && <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>}
          </div>
          <button onClick={openCreate} className="btn-primary">+ Add Department</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏢</div>
              <p className="text-gray-500">No departments yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Classes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{d.name}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs">
                        <p className="truncate">{d.description || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{d.classes_count ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={d.is_active ? 'badge badge-green' : 'badge badge-gray'}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleToggleActive(d)}
                            className="btn-secondary text-xs px-2.5 py-1"
                          >
                            {d.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => openEdit(d)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                          <button onClick={() => setDeleteId(d.id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
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
        title={editDepartment ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleFormSubmit} disabled={formLoading} className="btn-primary">
              {formLoading ? <Spinner size="sm" /> : editDepartment ? 'Update' : 'Create'}
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
              placeholder="e.g. Computer Science"
            />
          </FormField>
          <FormField label="Description" error={formErrors.description}>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => handleField('description', e.target.value)}
              className="input"
              placeholder="Optional description"
            />
          </FormField>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="department_is_active"
              checked={form.is_active}
              onChange={e => handleField('is_active', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="department_is_active" className="text-sm text-gray-700">Active (visible to students)</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Department?"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <p className="text-gray-600">
          This will permanently delete the department. Departments with classes assigned cannot be deleted — reassign or remove the classes first.
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
