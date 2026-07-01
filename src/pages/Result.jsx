import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizApi } from '../lib/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import SkeletonCard from '../components/ui/SkeletonCard';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Result() {
  const { attemptCode } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    quizApi.result(attemptCode)
      .then(res => setResult(res.data))
      .catch(() => {
        toast.error('Failed to load result');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [attemptCode]);

  const handleDownload = async (type) => {
    if (type === 'pdf') setDownloadingPdf(true);
    else setDownloadingExcel(true);
    try {
      const res = type === 'pdf'
        ? await quizApi.downloadPdf(attemptCode)
        : await quizApi.downloadExcel(attemptCode);
      downloadBlob(res.data, `quiz-report-${attemptCode}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingPdf(false);
      setDownloadingExcel(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center mt-20"><Spinner size="lg" /></div></Layout>;
  if (!result) return null;

  const { attempt, answers } = result;
  const isPassed = attempt.score >= 50;
  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

  const filteredAnswers = answers.filter(a => {
    if (filter === 'correct') return a.is_correct;
    if (filter === 'incorrect') return !a.is_correct && a.selected_choice;
    if (filter === 'unanswered') return !a.selected_choice;
    return true;
  });

  return (
    <Layout>
      {/* Result Header */}
      <div className={`rounded-2xl p-8 text-white mb-6 ${isPassed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="text-center">
            <div className="text-8xl font-bold mb-1">{attempt.score}</div>
            <div className="text-white/80 text-lg">out of {attempt.total_questions}</div>
            <div className={`mt-2 inline-block px-4 py-1 rounded-full font-bold text-sm ${isPassed ? 'bg-white text-green-600' : 'bg-white text-red-600'}`}>
              {isPassed ? '🎉 PASSED' : '❌ FAILED'}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard label="Correct" value={attempt.correct_count} bg="bg-white/20" />
            <ScoreCard label="Incorrect" value={attempt.incorrect_count} bg="bg-white/20" />
            <ScoreCard label="Unanswered" value={attempt.unanswered_count} bg="bg-white/20" />
            <ScoreCard label="Avg Time" value={`${attempt.avg_time_seconds}s`} bg="bg-white/20" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Dashboard
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloadingPdf}
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {downloadingPdf ? <Spinner size="sm" /> : null}
            📄 Download PDF
          </button>
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloadingExcel}
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {downloadingExcel ? <Spinner size="sm" /> : null}
            📊 Download Excel
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Score</span>
          <span className="text-sm font-semibold">{percentage}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0</span>
          <span className="text-orange-500">Pass: 50</span>
          <span>100</span>
        </div>
      </div>

      {/* Answer Review */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Answer Review</h2>
          <div className="flex gap-2">
            {['all', 'correct', 'incorrect', 'unanswered'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnswers.map((a, idx) => (
            <div
              key={a.question_id}
              className={`border rounded-xl p-5 ${
                a.is_correct ? 'border-green-200 bg-green-50' :
                !a.selected_choice ? 'border-gray-200 bg-gray-50' :
                'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="font-medium text-gray-900 flex-1">
                  <span className="text-gray-400 mr-2">Q{idx + 1}.</span>
                  {a.question_text}
                </p>
                <div className="flex-shrink-0">
                  {a.is_correct
                    ? <span className="badge badge-green">✓ Correct</span>
                    : !a.selected_choice
                    ? <span className="badge badge-gray">— Skipped</span>
                    : <span className="badge badge-red">✗ Wrong</span>
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {['A', 'B', 'C', 'D'].map(choice => {
                  const choiceKey = `choice_${choice.toLowerCase()}`;
                  const isCorrect = choice === a.correct_choice;
                  const isUserChoice = choice === a.selected_choice;

                  return (
                    <div
                      key={choice}
                      className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${
                        isCorrect
                          ? 'border-green-500 bg-green-100 text-green-800 font-medium'
                          : isUserChoice && !isCorrect
                          ? 'border-red-400 bg-red-100 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      <span className="font-bold w-5">{choice}.</span>
                      <span className="flex-1 truncate">{a[choiceKey]}</span>
                      {isCorrect && <span>✓</span>}
                      {isUserChoice && !isCorrect && <span>✗</span>}
                    </div>
                  );
                })}
              </div>

              {a.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <span className="font-semibold">Explanation: </span>{a.explanation}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-2">
                Time taken: {a.time_taken_seconds ?? 0}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function ScoreCard({ label, value, bg }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-white/80 text-xs">{label}</div>
    </div>
  );
}
