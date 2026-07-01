import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { quizApi } from '../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

export default function MyReport() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizApi.stats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center mt-20"><Spinner size="lg" /></div>
      </Layout>
    );
  }

  if (!stats || stats.total_attempts === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No data yet</h2>
          <p className="text-gray-500 mb-6">Complete at least one quiz to see your report.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2.5">
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const accuracyPct = stats.total_answered > 0
    ? Math.round((stats.total_correct / stats.total_answered) * 100)
    : 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Report</h1>
        <p className="text-gray-500 text-sm mt-1">Your overall quiz performance summary</p>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Quizzes" value={stats.total_attempts} icon="📝" color="blue" />
        <StatCard label="Passed" value={stats.passed} sub={`${stats.pass_rate}% pass rate`} icon="✅" color="green" />
        <StatCard label="Failed" value={stats.failed} icon="❌" color="red" />
        <StatCard label="Best Score" value={`${stats.best_score}`} sub="out of 100" icon="🏆" color="yellow" />
        <StatCard label="Avg Score" value={`${stats.avg_score}`} sub="out of 100" icon="📈" color="blue" />
        <StatCard label="Total Correct" value={stats.total_correct} sub={`of ${stats.total_answered} answered`} icon="✓" color="green" />
        <StatCard label="Accuracy" value={`${accuracyPct}%`} sub="correct answers" icon="🎯" color="indigo" />
        <StatCard label="Total Wrong" value={stats.total_answered - stats.total_correct} icon="✗" color="red" />
      </div>

      {/* Score trend chart */}
      {stats.recent_scores.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Score Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.recent_scores} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [value, 'Score']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.subject || label}
              />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Pass', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}
                label={{ position: 'top', fontSize: 10, fill: '#6b7280' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject breakdown */}
      {stats.by_subject.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Attempts</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Avg Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Best Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_subject.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{row.subject}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row.attempts}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${row.avg_score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                        {row.avg_score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-blue-600">{row.best_score}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.pass_rate >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {row.pass_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    yellow: 'bg-yellow-50 text-yellow-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="card py-4 text-center">
      <div className={`text-2xl mb-1 w-10 h-10 rounded-full ${colors[color]} flex items-center justify-center mx-auto font-bold`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-2">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
