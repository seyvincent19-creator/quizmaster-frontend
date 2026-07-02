import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminReportsApi, adminClassesApi } from '../../lib/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [filters, setFilters] = useState({ from: '', to: '', min_score: '', max_score: '', category: '', difficulty: '', class_name: '', generation: '' });
  const [summary, setSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsMeta, setAttemptsMeta] = useState(null);
  const [analysis, setAnalysis] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [tab, setTab] = useState('summary');
  const [classOptions, setClassOptions] = useState([]);
  const [generationOptions, setGenerationOptions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, attRes, anaRes] = await Promise.all([
        adminReportsApi.summary(filters),
        adminReportsApi.attempts({ ...filters, page }),
        adminReportsApi.questionAnalysis(filters),
      ]);
      setSummary(sumRes.data);
      setAttempts(attRes.data.data);
      setAttemptsMeta(attRes.data.meta);
      setAnalysis(anaRes.data.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminClassesApi.list().then(r => {
      const classes = r.data.data;
      setClassOptions([...new Set(classes.map(c => c.name))].sort());
      setGenerationOptions([...new Set(classes.map(c => c.generation).filter(Boolean))].sort());
    }).catch(() => {});
  }, []);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'excel'
        ? await adminReportsApi.exportExcel(filters)
        : await adminReportsApi.exportPdf(filters);
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(res.data, `admin-report-${new Date().toISOString().slice(0, 10)}.${ext}`);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const analysisChartData = analysis.slice(0, 15).map(q => ({
    name: q.question_text.length > 30 ? q.question_text.slice(0, 30) + '…' : q.question_text,
    correct: q.correct_count,
    incorrect: q.incorrect_count,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Filter and export quiz analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('excel')}
              disabled={!!exporting}
              className="btn-secondary flex items-center gap-2"
            >
              {exporting === 'excel' ? <Spinner size="sm" /> : '📊'}
              Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              className="btn-secondary flex items-center gap-2"
            >
              {exporting === 'pdf' ? <Spinner size="sm" /> : '📄'}
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label text-xs">From Date</label>
              <input type="date" value={filters.from} onChange={e => handleFilterChange('from', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label text-xs">To Date</label>
              <input type="date" value={filters.to} onChange={e => handleFilterChange('to', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label text-xs">Min Score</label>
              <input type="number" min="0" max="100" value={filters.min_score} onChange={e => handleFilterChange('min_score', e.target.value)} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label text-xs">Max Score</label>
              <input type="number" min="0" max="100" value={filters.max_score} onChange={e => handleFilterChange('max_score', e.target.value)} className="input" placeholder="100" />
            </div>
            <div>
              <label className="label text-xs">Difficulty</label>
              <select value={filters.difficulty} onChange={e => handleFilterChange('difficulty', e.target.value)} className="input">
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <input type="text" value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="input" placeholder="e.g. Science" />
            </div>
            <div>
              <label className="label text-xs">Class</label>
              <select value={filters.class_name} onChange={e => handleFilterChange('class_name', e.target.value)} className="input">
                <option value="">All Classes</option>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Generation</label>
              <select value={filters.generation} onChange={e => handleFilterChange('generation', e.target.value)} className="input">
                <option value="">All Generations</option>
                {generationOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Total Students" value={summary.total_users} color="blue" />
            <KpiCard label="Active Students" value={summary.active_users} color="green" />
            <KpiCard label="Total Attempts" value={summary.total_attempts} color="purple" />
            <KpiCard label="Avg Score" value={summary.avg_score} color="blue" />
            <KpiCard label="Pass Rate" value={`${summary.pass_rate}%`} color="green" />
            <KpiCard label="Pass Count" value={summary.pass_count} color="orange" />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            {['summary', 'students', 'attempts', 'analysis'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'students' ? 'Students' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Students Report Table */}
            {tab === 'students' && (
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Generation</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Result</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Started At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-gray-400">No data found</td></tr>
                      ) : attempts.map((a, i) => (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-400">{((page - 1) * 20) + i + 1}</td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{a.user?.name}</p>
                            <p className="text-xs text-gray-400">{a.user?.email}</p>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{a.user?.class_name || <span className="text-gray-300">—</span>}</td>
                          <td className="py-3 px-4 text-gray-600">{a.user?.generation || <span className="text-gray-300">—</span>}</td>
                          <td className="py-3 px-4 text-gray-600">{a.subject_name}</td>
                          <td className="py-3 px-4 font-semibold text-gray-800">{a.score}/{a.total_questions}</td>
                          <td className="py-3 px-4">
                            <span className={a.score >= 50 ? 'badge badge-green' : 'badge badge-red'}>
                              {a.score >= 50 ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {a.started_at ? new Date(a.started_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={attemptsMeta} onPageChange={setPage} />
              </div>
            )}

            {/* Attempts Table */}
            {tab === 'attempts' && (
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Attempt Code</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Result</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Finished At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((a, i) => (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-400">{((page - 1) * 20) + i + 1}</td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{a.user?.name}</p>
                            <p className="text-xs text-gray-400">{a.user?.email}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">{a.attempt_code?.slice(0, 12)}…</td>
                          <td className="py-3 px-4 font-semibold">{a.score}/{a.total_questions}</td>
                          <td className="py-3 px-4">
                            <span className={a.score >= 50 ? 'badge badge-green' : 'badge badge-red'}>
                              {a.score >= 50 ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {a.finished_at ? new Date(a.finished_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={attemptsMeta} onPageChange={setPage} />
              </div>
            )}

            {/* Question Analysis */}
            {tab === 'analysis' && (
              <div className="space-y-6">
                {analysisChartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Correct vs Incorrect by Question</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisChartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={200} />
                        <Tooltip />
                        <Bar dataKey="correct" fill="#10b981" name="Correct" />
                        <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Question Analysis Table</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Question</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Difficulty</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Total</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Correct</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Incorrect</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Correct Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.map((q, i) => (
                          <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="truncate text-gray-800">{q.question_text}</p>
                              <p className="text-xs text-gray-400">{q.category}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-blue'}`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="py-3 px-4">{q.total_attempts}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">{q.correct_count}</td>
                            <td className="py-3 px-4 text-red-600 font-medium">{q.incorrect_count}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 bg-gray-200 rounded-full w-16 overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${q.correct_rate}%` }} />
                                </div>
                                <span className="text-xs text-gray-600">{q.correct_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Tab */}
            {tab === 'summary' && summary && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Summary Report</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Total Students', summary.total_users],
                      ['Active Students', summary.active_users],
                      ['Total Completed Attempts', summary.total_attempts],
                      ['Average Score', `${summary.avg_score} / 100`],
                      ['Pass Rate', `${summary.pass_rate}%`],
                      ['Pass Count', summary.pass_count],
                      ['Fail Count', summary.total_attempts - summary.pass_count],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-600 bg-gray-50 w-1/3">{label}</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function KpiCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
  };
  return (
    <div className={`${colors[color] || colors.blue} border rounded-xl p-4`}>
      <div className="text-xl font-bold">{value ?? '—'}</div>
      <div className="text-xs mt-0.5">{label}</div>
    </div>
  );
}
