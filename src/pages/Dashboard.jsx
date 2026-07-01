import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import { useQuizStore } from '../stores/quizStore';
import { quizApi, subjectsApi } from '../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import { SkeletonTable } from '../components/ui/SkeletonCard';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { startQuiz, loading: quizLoading } = useQuizStore();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);
  const [subjectModal, setSubjectModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(undefined); // undefined = not picked yet

  const loadHistory = useCallback(async (p = 1) => {
    setHistoryLoading(true);
    try {
      const res = await quizApi.history(p);
      setHistory(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  const openSubjectModal = async () => {
    setSelectedSubjectId(undefined);
    setSubjectModal(true);
    setSubjectsLoading(true);
    try {
      const res = await subjectsApi.list();
      setSubjects(res.data.data);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (selectedSubjectId === undefined) {
      toast.error('Please select a subject');
      return;
    }
    setSubjectModal(false);
    const result = await startQuiz(selectedSubjectId);
    if (result.success) {
      navigate(`/quiz/${result.attemptCode}`);
    } else {
      toast.error(result.error || 'Failed to start quiz');
    }
  };

  const handleDownload = async (attemptCode, type) => {
    setDownloadingId(`${attemptCode}-${type}`);
    try {
      const res = type === 'pdf'
        ? await quizApi.downloadPdf(attemptCode)
        : await quizApi.downloadExcel(attemptCode);
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data, `quiz-report-${attemptCode}.${ext}`);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status, score, total) => {
    if (status === 'in_progress') {
      return <span className="badge badge-yellow">In Progress</span>;
    }
    const pass = score >= 50;
    return (
      <div className="flex gap-2 items-center">
        <span className={pass ? 'badge badge-green' : 'badge badge-red'}>
          {pass ? 'PASS' : 'FAIL'}
        </span>
        <span className="text-sm font-semibold">{score}/{total}</span>
      </div>
    );
  };

  return (
    <Layout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-blue-100 mb-6">Ready to test your knowledge? Each quiz has 100 questions with 60 seconds per question.</p>
        <button
          onClick={openSubjectModal}
          disabled={quizLoading}
          className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {quizLoading ? <Spinner size="sm" /> : null}
          Start New Quiz
        </button>
      </div>

      {/* Stats row */}
      {!historyLoading && meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Attempts" value={meta.total} icon="📝" />
          <StatCard
            label="Best Score"
            value={history.filter(h => h.status === 'completed').length > 0
              ? Math.max(...history.filter(h => h.status === 'completed').map(h => h.score)) + '/100'
              : 'N/A'}
            icon="🏆"
          />
          <StatCard
            label="Avg Score"
            value={
              history.filter(h => h.status === 'completed').length > 0
                ? Math.round(history.filter(h => h.status === 'completed').reduce((a, b) => a + b.score, 0) / history.filter(h => h.status === 'completed').length) + '/100'
                : 'N/A'
            }
            icon="📊"
          />
          <StatCard
            label="Pass Rate"
            value={
              history.filter(h => h.status === 'completed').length > 0
                ? Math.round((history.filter(h => h.score >= 50 && h.status === 'completed').length / history.filter(h => h.status === 'completed').length) * 100) + '%'
                : 'N/A'
            }
            icon="✅"
          />
        </div>
      )}

      {/* History Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Attempt History</h2>

        {historyLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-gray-500">No quiz attempts yet. Start your first quiz!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Attempt Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status / Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(attempt => (
                    <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{attempt.attempt_code?.slice(0, 8)}…</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{attempt.subject_name || <span className="text-gray-400 italic">All Subjects</span>}</td>
                      <td className="py-3 px-4">{getStatusBadge(attempt.status, attempt.score, attempt.total_questions)}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(attempt.started_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {attempt.status === 'in_progress' && (
                            <button
                              onClick={() => navigate(`/quiz/${attempt.attempt_code}`)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              Resume
                            </button>
                          )}
                          {attempt.status === 'completed' && (
                            <>
                              <button
                                onClick={() => navigate(`/result/${attempt.attempt_code}`)}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleDownload(attempt.attempt_code, 'pdf')}
                                disabled={downloadingId === `${attempt.attempt_code}-pdf`}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                {downloadingId === `${attempt.attempt_code}-pdf` ? '…' : 'PDF'}
                              </button>
                              <button
                                onClick={() => handleDownload(attempt.attempt_code, 'excel')}
                                disabled={downloadingId === `${attempt.attempt_code}-excel`}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                {downloadingId === `${attempt.attempt_code}-excel` ? '…' : 'Excel'}
                              </button>
                            </>
                          )}
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

      {/* Subject Picker Modal */}
      <Modal
        isOpen={subjectModal}
        onClose={() => setSubjectModal(false)}
        title="Choose a Subject"
        footer={
          <>
            <button onClick={() => setSubjectModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleStartQuiz}
              disabled={quizLoading || selectedSubjectId === undefined}
              className="btn-primary"
            >
              {quizLoading ? <Spinner size="sm" /> : 'Start Quiz'}
            </button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-sm text-gray-500 mb-4">Select the subject for your quiz, or pick "All Subjects" for 100 random questions.</p>
          {subjectsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
              {/* All Subjects card */}
              <SubjectCard
                selected={selectedSubjectId === null}
                onClick={() => setSelectedSubjectId(null)}
                icon="🌐"
                name="All Subjects"
                description="100 random questions from the full pool"
                count={null}
                countLabel="100 questions"
              />
              {subjects.map(s => (
                <SubjectCard
                  key={s.id}
                  selected={selectedSubjectId === s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  icon="📚"
                  name={s.name}
                  description={s.description}
                  count={s.active_questions_count}
                  countLabel={`${s.active_questions_count} question${s.active_questions_count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card text-center py-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SubjectCard({ selected, onClick, icon, name, description, countLabel }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${selected ? 'text-blue-800' : 'text-gray-800'}`}>{name}</p>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${selected ? 'text-blue-600' : 'text-gray-400'}`}>
          {countLabel}
        </span>
      </div>
    </button>
  );
}
