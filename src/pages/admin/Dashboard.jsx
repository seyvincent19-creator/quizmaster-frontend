import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminReportsApi, subjectsApi, quizApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import SkeletonCard from '../../components/ui/SkeletonCard';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total_users: 0,
    active_users: 0,
    total_attempts: 0,
    pass_rate: 0,
    avg_score: 0,
    pass_count: 0,
  });
  const [attempts, setAttempts] = useState([]);
  const [questionAnalysis, setQuestionAnalysis] = useState([]);
  const [byClass, setByClass] = useState([]);
  const [byGeneration, setByGeneration] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectModal, setSubjectModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(undefined);
  const [quizStarting, setQuizStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    setQuizStarting(true);
    try {
      const res = await quizApi.start(selectedSubjectId);
      setSubjectModal(false);
      navigate(`/quiz/${res.data.attempt_code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setQuizStarting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [summaryRes, attemptsRes, analysisRes, byClassRes, byGenerationRes] = await Promise.allSettled([
      adminReportsApi.summary({}),
      adminReportsApi.attempts({ per_page: 100 }),
      adminReportsApi.questionAnalysis({}),
      adminReportsApi.byClass(),
      adminReportsApi.byGeneration(),
    ]);

    if (summaryRes.status === 'fulfilled') {
      setSummary({
        total_users: summaryRes.value.data?.total_users ?? 0,
        active_users: summaryRes.value.data?.active_users ?? 0,
        total_attempts: summaryRes.value.data?.total_attempts ?? 0,
        pass_rate: summaryRes.value.data?.pass_rate ?? 0,
        avg_score: summaryRes.value.data?.avg_score ?? 0,
        pass_count: summaryRes.value.data?.pass_count ?? 0,
      });
    }

    if (attemptsRes.status === 'fulfilled') {
      setAttempts(attemptsRes.value.data?.data || []);
    } else {
      setAttempts([]);
    }

    if (analysisRes.status === 'fulfilled') {
      setQuestionAnalysis((analysisRes.value.data?.data || []).slice(0, 10));
    } else {
      setQuestionAnalysis([]);
    }

    if (byClassRes.status === 'fulfilled') {
      setByClass(byClassRes.value.data || []);
    } else {
      setByClass([]);
    }

    if (byGenerationRes.status === 'fulfilled') {
      setByGeneration(byGenerationRes.value.data || []);
    } else {
      setByGeneration([]);
    }

    if ([summaryRes, attemptsRes, analysisRes, byClassRes, byGenerationRes].some(r => r.status === 'rejected')) {
      toast.error('Some dashboard data failed to load');
    }

    setLoading(false);
  };

  // Score distribution for bar chart
  const scoreDistribution = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-50', count: 0 },
    { range: '51-70', count: 0 },
    { range: '71-90', count: 0 },
    { range: '91-100', count: 0 },
  ];

  attempts.forEach(a => {
    const s = a.score;
    if (s <= 20) scoreDistribution[0].count++;
    else if (s <= 40) scoreDistribution[1].count++;
    else if (s <= 50) scoreDistribution[2].count++;
    else if (s <= 70) scoreDistribution[3].count++;
    else if (s <= 90) scoreDistribution[4].count++;
    else scoreDistribution[5].count++;
  });

  const passFailData = [
    { name: 'Pass', value: summary.pass_count },
    { name: 'Fail', value: summary.total_attempts - summary.pass_count },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of QuizMaster analytics</p>
        </div>
        <button onClick={openSubjectModal} className="btn-primary flex items-center gap-2">
          🎯 Take a Quiz
        </button>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Total Students" value={summary?.total_users} icon="🎓" color="blue" />
              <KpiCard label="Active Students" value={summary?.active_users} icon="✅" color="green" />
              <KpiCard label="Total Attempts" value={summary?.total_attempts} icon="📝" color="purple" />
              <KpiCard label="Pass Rate" value={`${summary?.pass_rate ?? 0}%`} icon="🏆" color="orange" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KpiCard label="Avg Score" value={`${summary?.avg_score ?? 0}/100`} icon="📊" color="blue" />
              <KpiCard label="Pass Count" value={summary?.pass_count} icon="🎯" color="green" />
              <KpiCard label="Fail Count" value={(summary?.total_attempts || 0) - (summary?.pass_count || 0)} icon="❌" color="red" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pass/Fail Pie */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Pass / Fail Ratio</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={passFailData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {passFailData.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Incorrect Questions */}
            {questionAnalysis.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Most Difficult Questions</h3>
                <div className="space-y-3">
                  {questionAnalysis.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{q.question_text}</p>
                        <p className="text-xs text-gray-400">{q.difficulty} · {q.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{q.incorrect_count} wrong</p>
                        <p className="text-xs text-gray-400">{q.correct_rate}% correct</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance by Class & Generation */}
            {(byClass.length > 0 || byGeneration.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {byClass.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Avg Score by Class</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byClass.map(d => ({ name: d.class_name, score: parseFloat(d.avg_score), pass: parseFloat(d.pass_rate) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v, n) => [`${v}${n === 'pass' ? '%' : ''}`, n === 'score' ? 'Avg Score' : 'Pass Rate']} />
                        <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="score" />
                        <Bar dataKey="pass" fill="#10b981" radius={[4, 4, 0, 0]} name="pass" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Avg Score</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Pass Rate %</span>
                    </div>
                  </div>
                )}
                {byGeneration.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Avg Score by Generation</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byGeneration.map(d => ({ name: d.generation, score: parseFloat(d.avg_score), pass: parseFloat(d.pass_rate) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v, n) => [`${v}${n === 'pass' ? '%' : ''}`, n === 'score' ? 'Avg Score' : 'Pass Rate']} />
                        <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="score" />
                        <Bar dataKey="pass" fill="#f59e0b" radius={[4, 4, 0, 0]} name="pass" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Avg Score</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Pass Rate %</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              disabled={quizStarting || selectedSubjectId === undefined}
              className="btn-primary"
            >
              {quizStarting ? <Spinner size="sm" /> : 'Start Quiz'}
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
              <SubjectCard
                selected={selectedSubjectId === null}
                onClick={() => setSelectedSubjectId(null)}
                icon="🌐"
                name="All Subjects"
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
                  countLabel={`${s.active_questions_count} question${s.active_questions_count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}

function SubjectCard({ selected, onClick, icon, name, description, countLabel }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${selected ? 'text-purple-800' : 'text-gray-800'}`}>{name}</p>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${selected ? 'text-purple-600' : 'text-gray-400'}`}>
          {countLabel}
        </span>
      </div>
    </button>
  );
}

function KpiCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  };
  return (
    <div className={`${colors[color] || colors.blue} border rounded-xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
