import { create } from 'zustand';
import { quizApi } from '../lib/api';

// Backend stores original choice letter; convert to displayed position so
// highlight logic (selectedChoice === 'A'/'B'/'C'/'D') stays consistent.
const toDisplayedChoices = (answers) => {
  const letters = ['A', 'B', 'C', 'D'];
  const result = {};
  for (const [qId, ans] of Object.entries(answers || {})) {
    if (ans.selected_choice && ans.choice_order) {
      const idx = ans.choice_order.indexOf(ans.selected_choice);
      result[qId] = { ...ans, selected_choice: idx >= 0 ? letters[idx] : null };
    } else {
      result[qId] = ans;
    }
  }
  return result;
};

export const useQuizStore = create((set, get) => ({
  attempt: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  loading: false,
  error: null,
  timeLeft: 60,
  timerActive: false,
  timerInterval: null,

  startQuiz: async (subjectId = null) => {
    set({ loading: true, error: null });
    try {
      const res = await quizApi.start(subjectId);
      const data = res.data;
      set({
        attempt: {
          attempt_code: data.attempt_code,
          status: data.status,
          total_questions: data.total_questions,
          subject_id: data.subject_id,
          subject_name: data.subject_name,
          started_at: data.started_at,
        },
        questions: data.questions,
        answers: toDisplayedChoices(data.answers),
        currentIndex: data.current_index || 0,
        loading: false,
        timeLeft: 60,
      });
      return { success: true, attemptCode: data.attempt_code };
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to start quiz';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  resumeQuiz: async (attemptCode) => {
    set({ loading: true, error: null });
    try {
      const res = await quizApi.resume(attemptCode);
      const data = res.data;
      set({
        attempt: {
          attempt_code: data.attempt_code,
          status: data.status,
          total_questions: data.total_questions,
          subject_id: data.subject_id,
          subject_name: data.subject_name,
          started_at: data.started_at,
        },
        questions: data.questions,
        answers: toDisplayedChoices(data.answers),
        currentIndex: data.current_index || 0,
        loading: false,
        timeLeft: 60,
      });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || 'Failed to load quiz' });
      return { success: false };
    }
  },

  saveAnswer: async (questionId, selectedChoice, timeTaken, isLocked = false) => {
    const { attempt } = get();
    if (!attempt) return;

    try {
      const res = await quizApi.answer(attempt.attempt_code, {
        question_id: questionId,
        selected_choice: selectedChoice,
        time_taken_seconds: timeTaken,
        is_locked: isLocked,
      });

      set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: {
            ...state.answers[questionId],
            question_id: questionId,
            selected_choice: selectedChoice,
            is_locked: isLocked,
          },
        },
      }));

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  selectAnswer: (questionId, choice) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          question_id: questionId,
          selected_choice: choice,
          is_locked: false,
        },
      },
    }));
  },

  lockAnswer: async (questionId, timeTaken) => {
    const { answers } = get();
    const selectedChoice = answers[questionId]?.selected_choice || null;
    return await get().saveAnswer(questionId, selectedChoice, timeTaken, true);
  },

  goToNext: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1, timeLeft: 60 });
    }
  },

  goToPrev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  goToQuestion: (index) => {
    set({ currentIndex: index });
  },

  finishQuiz: async () => {
    const { attempt } = get();
    if (!attempt) return { success: false };

    try {
      const res = await quizApi.finish(attempt.attempt_code);
      set({ attempt: { ...attempt, status: 'completed' } });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  setTimeLeft: (time) => set({ timeLeft: time }),

  resetQuiz: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    set({
      attempt: null,
      questions: [],
      answers: {},
      currentIndex: 0,
      loading: false,
      error: null,
      timeLeft: 60,
      timerActive: false,
      timerInterval: null,
    });
  },
}));
