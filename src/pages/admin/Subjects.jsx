import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminSubjectsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const emptyForm = { name: '', description: '', is_active: true };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSubjectsApi.list();
      setSubjects(res.data.data);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditSubject(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditSubject(s);
    setForm({ name: s.name, description: s.description || '', is_active: s.is_active });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});
    try {
      if (editSubject) {
        await adminSubjectsApi.update(editSubject.id, form);
        toast.success('Subject updated!');
      } else {
        await adminSubjectsApi.create(form);
        toast.success('Subject created!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
      else toast.error(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminSubjectsApi.delete(deleteId);
      toast.success('Subject deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (subject) => {
    try {
      await adminSubjectsApi.toggleActive(subject.id);
      toast.success(`Subject ${subject.is_active ? 'deactivated' : 'activated'}`);
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
            <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
            {!loading && <p className="text-gray-500 text-sm mt-1">{subjects.length} subjects</p>}
          </div>
          <button onClick={openCreate} className="btn-primary">+ Add Subject</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-gray-500">No subjects yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Questions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Active Questions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{s.name}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs">
                        <p className="truncate">{s.description || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{s.questions_count ?? 0}</td>
                      <td className="py-3 px-4 text-gray-600">{s.active_questions_count ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={s.is_active ? 'badge badge-green' : 'badge badge-gray'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleToggleActive(s)}
                            className="btn-secondary text-xs px-2.5 py-1"
                          >
                            {s.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => openEdit(s)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                          <button onClick={() => setDeleteId(s.id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
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
        title={editSubject ? 'Edit Subject' : 'Add Subject'}
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleFormSubmit} disabled={formLoading} className="btn-primary">
              {formLoading ? <Spinner size="sm" /> : editSubject ? 'Update' : 'Create'}
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
              placeholder="e.g. PHP Programming"
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
              id="subject_is_active"
              checked={form.is_active}
              onChange={e => handleField('is_active', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="subject_is_active" className="text-sm text-gray-700">Active (visible to students)</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Subject?"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <p className="text-gray-600">
          This will permanently delete the subject. Subjects with questions assigned cannot be deleted — reassign or remove questions first.
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
