import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminQuestionsApi, adminSubjectsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { SkeletonTable } from '../../components/ui/SkeletonCard';

const emptyForm = {
  subject_id: '', question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '',
  correct_choice: 'A', explanation: '', difficulty: 'medium', category: '', is_active: true,
};

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: '', is_active: '', subject_id: '' });
  const [subjectsList, setSubjectsList] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminQuestionsApi.list({ page, search, ...filters });
      setQuestions(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);

  // Load subjects for dropdowns
  useEffect(() => {
    adminSubjectsApi.list().then(res => setSubjectsList(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => { setEditQuestion(null); setForm(emptyForm); setFormErrors({}); setShowForm(true); };
  const openEdit = (q) => {
    setEditQuestion(q);
    setForm({ ...q, subject_id: q.subject_id ?? '' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});
    try {
      if (editQuestion) {
        await adminQuestionsApi.update(editQuestion.id, form);
        toast.success('Question updated!');
      } else {
        await adminQuestionsApi.create(form);
        toast.success('Question created!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
      else toast.error('Failed to save question');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminQuestionsApi.delete(deleteId);
      toast.success('Question deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      const params = filters.subject_id ? { subject_id: filters.subject_id } : {};
      const res = await adminQuestionsApi.deleteAll(params);
      toast.success(res.data.message);
      setShowDeleteAll(false);
      load();
    } catch {
      toast.error('Failed to delete questions');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleImport = async () => {
    setImportLoading(true);
    try {
      const data = JSON.parse(importJson);
      const payload = Array.isArray(data) ? { questions: data } : data;
      const res = await adminQuestionsApi.importJson(payload);
      toast.success(res.data.message);
      setShowImport(false);
      setImportJson('');
      load();
    } catch (err) {
      if (err instanceof SyntaxError) toast.error('Invalid JSON format');
      else toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImportLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
            {meta && <p className="text-gray-500 text-sm mt-1">{meta.total} total · {meta.active_count} active</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteAll(true)} className="btn-danger gap-2">
              🗑 Delete All
            </button>
            <button onClick={() => setShowImport(true)} className="btn-secondary gap-2">
              📤 Import JSON
            </button>
            <button onClick={openCreate} className="btn-primary gap-2">
              + Add Question
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card py-4">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text" placeholder="Search questions..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input flex-1 min-w-48"
            />
            <select className="input w-40" value={filters.difficulty} onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}>
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select className="input w-36" value={filters.is_active} onChange={e => { setFilters(f => ({ ...f, is_active: e.target.value })); setPage(1); }}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select className="input w-44" value={filters.subject_id} onChange={e => { setFilters(f => ({ ...f, subject_id: e.target.value })); setPage(1); }}>
              <option value="">All Subjects</option>
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? <SkeletonTable rows={8} cols={5} /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Question</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Correct</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Difficulty</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, i) => (
                      <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400">{((page - 1) * 20) + i + 1}</td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate font-medium text-gray-800">{q.question_text}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{q.subject_name || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="badge badge-green font-bold">{q.correct_choice}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-blue'}`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={q.is_active ? 'badge badge-green' : 'badge badge-gray'}>
                            {q.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(q)} className="btn-secondary text-xs px-2.5 py-1">Edit</button>
                            <button onClick={() => setDeleteId(q.id)} className="btn-danger text-xs px-2.5 py-1">Delete</button>
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

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editQuestion ? 'Edit Question' : 'Add Question'}
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleFormSubmit} disabled={formLoading} className="btn-primary">
              {formLoading ? <Spinner size="sm" /> : editQuestion ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
          <FormField label="Subject" error={formErrors.subject_id}>
            <select
              value={form.subject_id}
              onChange={e => handleField('subject_id', e.target.value ? Number(e.target.value) : '')}
              className="input"
            >
              <option value="">— No Subject —</option>
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Question" error={formErrors.question_text}>
            <textarea rows={3} value={form.question_text} onChange={e => handleField('question_text', e.target.value)}
              className={`input ${formErrors.question_text ? 'border-red-400' : ''}`} />
          </FormField>
          {['a', 'b', 'c', 'd'].map(c => (
            <FormField key={c} label={`Choice ${c.toUpperCase()}`} error={formErrors[`choice_${c}`]}>
              <input value={form[`choice_${c}`]} onChange={e => handleField(`choice_${c}`, e.target.value)}
                className={`input ${formErrors[`choice_${c}`] ? 'border-red-400' : ''}`} />
            </FormField>
          ))}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Correct" error={formErrors.correct_choice}>
              <select value={form.correct_choice} onChange={e => handleField('correct_choice', e.target.value)} className="input">
                {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Difficulty" error={formErrors.difficulty}>
              <select value={form.difficulty} onChange={e => handleField('difficulty', e.target.value)} className="input">
                {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Category">
              <input value={form.category} onChange={e => handleField('category', e.target.value)} className="input" placeholder="Optional" />
            </FormField>
          </div>
          <FormField label="Explanation">
            <textarea rows={2} value={form.explanation} onChange={e => handleField('explanation', e.target.value)} className="input" />
          </FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => handleField('is_active', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active (include in quizzes)</label>
          </div>
        </div>
      </Modal>

      {/* Import JSON Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import Questions (JSON)"
        footer={
          <>
            <button onClick={() => setShowImport(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleImport} disabled={importLoading} className="btn-primary">
              {importLoading ? <Spinner size="sm" /> : 'Import'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-3">
          Paste a JSON array of questions or an object with a "questions" array.
        </p>
        <textarea
          rows={10} value={importJson} onChange={e => setImportJson(e.target.value)}
          className="input font-mono text-xs"
          placeholder={`[\n  {\n    "question_text": "...",\n    "choice_a": "...", "choice_b": "...", "choice_c": "...", "choice_d": "...",\n    "correct_choice": "A",\n    "difficulty": "easy",\n    "category": "Science"\n  }\n]`}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Question?"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </>
        }
      >
        <p className="text-gray-600">This will permanently delete the question. This action cannot be undone.</p>
      </Modal>

      {/* Delete All Confirm */}
      <Modal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        title="Delete All Questions?"
        footer={
          <>
            <button onClick={() => setShowDeleteAll(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDeleteAll} disabled={deleteAllLoading} className="btn-danger">
              {deleteAllLoading ? <Spinner size="sm" /> : 'Delete All'}
            </button>
          </>
        }
      >
        {filters.subject_id ? (
          <p className="text-gray-600">
            This will permanently delete <strong>all questions for the selected subject</strong>. This action cannot be undone.
          </p>
        ) : (
          <p className="text-gray-600">
            This will permanently delete <strong>ALL questions in the entire question bank</strong>. This action cannot be undone.
          </p>
        )}
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
