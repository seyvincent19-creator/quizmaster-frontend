import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const TIMER_SECONDS = 60;

export default function Quiz() {
  const { attemptCode } = useParams();
  const navigate = useNavigate();
  const {
    attempt, questions, answers, currentIndex,
    resumeQuiz, selectAnswer, lockAnswer, goToNext, goToPrev,
    finishQuiz, loading, error, resetQuiz,
  } = useQuizStore();

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [timeTakenRef] = useState({ value: 0 });
  const timerRef = useRef(null);
  const lockedForCurrentQ = useRef(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  // Load quiz
  useEffect(() => {
    if (!attempt || attempt.attempt_code !== attemptCode) {
      resumeQuiz(attemptCode).then(result => {
        if (!result.success) {
          toast.error('Failed to load quiz');
          navigate('/dashboard');
        }
      });
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptCode]);

  // Timer logic
  const handleTimerEnd = useCallback(async () => {
    if (lockedForCurrentQ.current || !currentQuestion) return;
    lockedForCurrentQ.current = true;
    clearInterval(timerRef.current);

    await lockAnswer(currentQuestion.id, TIMER_SECONDS);

    // Auto-move to next
    const next = useQuizStore.getState().currentIndex + 1;
    if (next < questions.length) {
      setTimeout(() => {
        useQuizStore.getState().goToNext();
      }, 500);
    }
  }, [currentQuestion, lockAnswer]);

  useEffect(() => {
    if (!currentQuestion || attempt?.status === 'completed') return;

    // Check if already locked
    if (currentAnswer?.is_locked) {
      setTimeLeft(0);
      return;
    }

    lockedForCurrentQ.current = false;
    setTimeLeft(TIMER_SECONDS);
    timeTakenRef.value = 0;

    timerRef.current = setInterval(() => {
      timeTakenRef.value += 1;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, currentQuestion?.id]);

  const handleSelectChoice = (choice) => {
    if (currentAnswer?.is_locked || attempt?.status === 'completed') return;
    selectAnswer(currentQuestion.id, choice);
  };

  const handleLockAndNext = async () => {
    if (!currentQuestion || currentAnswer?.is_locked) {
      goToNext();
      return;
    }
    clearInterval(timerRef.current);
    lockedForCurrentQ.current = true;
    const taken = timeTakenRef.value;

    await lockAnswer(currentQuestion.id, taken);
    goToNext();
  };

  const handleFinish = async () => {
    setShowFinishModal(false);
    setIsSubmitting(true);

    // Lock current question if not locked
    if (currentQuestion && !currentAnswer?.is_locked) {
      clearInterval(timerRef.current);
      await lockAnswer(currentQuestion.id, timeTakenRef.value);
    }

    const result = await finishQuiz();
    setIsSubmitting(false);
    if (result.success) {
      toast.success('Quiz completed!');
      navigate(`/result/${attemptCode}`);
    } else {
      toast.error(result.error || 'Failed to submit quiz');
    }
  };

  if (loading || !attempt || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (attempt.status === 'completed') {
    navigate(`/result/${attemptCode}`);
    return null;
  }

  const answeredCount = Object.values(answers).filter(a => a?.is_locked).length;
  const progressPct = (answeredCount / questions.length) * 100;
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const isLocked = currentAnswer?.is_locked;
  const selectedChoice = currentAnswer?.selected_choice;
  const isLastQuestion = currentIndex === questions.length - 1;

  const timerColor = timeLeft > 20 ? 'bg-green-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500';
  const timerTextColor = timeLeft <= 10 ? 'text-red-600 animate-pulse font-bold' : 'text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {attempt?.subject_name ? attempt.subject_name : 'All Subjects'}
                </p>
                <p className="text-xs text-gray-500">{answeredCount}/{questions.length} answered</p>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 ${timerTextColor}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl tabular-nums">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>

            <button
              onClick={() => setShowFinishModal(true)}
              className="btn-danger text-sm px-4 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Finish Quiz'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Timer bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full ${timerColor} timer-bar`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main quiz content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="flex gap-6">
          {/* Question area */}
          <div className="flex-1">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
                <div className="flex gap-2">
                  {currentQuestion.difficulty && (
                    <span className={`badge ${
                      currentQuestion.difficulty === 'easy' ? 'badge-green' :
                      currentQuestion.difficulty === 'hard' ? 'badge-red' : 'badge-blue'
                    }`}>{currentQuestion.difficulty}</span>
                  )}
                  {currentQuestion.category && (
                    <span className="badge badge-gray">{currentQuestion.category}</span>
                  )}
                </div>
              </div>

              <p className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.question_text}
              </p>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(choice => {
                  const choiceKey = `choice_${choice.toLowerCase()}`;
                  const isSelected = selectedChoice === choice;
                  const isDisabled = isLocked;

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelectChoice(choice)}
                      disabled={isDisabled}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>{choice}</span>
                        <span className="flex-1 leading-relaxed">{currentQuestion[choiceKey]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isLocked && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {selectedChoice ? `You selected: ${selectedChoice}` : 'No answer selected (time expired)'}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className="btn-secondary px-5 py-2.5 disabled:opacity-40"
                >
                  ← Previous
                </button>

                {!isLastQuestion ? (
                  <button
                    onClick={handleLockAndNext}
                    className="btn-primary px-5 py-2.5 ml-auto"
                  >
                    {isLocked ? 'Next →' : 'Confirm & Next →'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="btn-success px-5 py-2.5 ml-auto"
                  >
                    Submit Quiz ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <div className="w-52 flex-shrink-0">
            <div className="card sticky top-28">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Navigator</p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isAnswered = ans?.is_locked && ans?.selected_choice;
                  const isUnanswered = ans?.is_locked && !ans?.selected_choice;
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => useQuizStore.getState().goToQuestion(idx)}
                      className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : isAnswered
                          ? 'bg-green-500 text-white'
                          : isUnanswered
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-green-500"></div> Answered ({Object.values(answers).filter(a => a?.is_locked && a?.selected_choice).length})
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-gray-400"></div> Skipped
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div> Not visited
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Confirmation Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Submit Quiz?"
        footer={
          <>
            <button onClick={() => setShowFinishModal(false)} className="btn-secondary">Keep Going</button>
            <button onClick={handleFinish} disabled={isSubmitting} className="btn-success">
              {isSubmitting ? <Spinner size="sm" /> : 'Submit Now'}
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-700 mb-4">Are you sure you want to submit your quiz?</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">
                {Object.values(answers).filter(a => a?.is_locked && a?.selected_choice).length}
              </p>
              <p className="text-xs text-gray-500">Answered</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-600">
                {Object.values(answers).filter(a => a?.is_locked && !a?.selected_choice).length}
              </p>
              <p className="text-xs text-gray-500">Skipped</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-600">
                {questions.length - Object.values(answers).filter(a => a?.is_locked).length}
              </p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Unanswered questions will count as incorrect.</p>
        </div>
      </Modal>
    </div>
  );
}
