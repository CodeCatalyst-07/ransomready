import { useEffect, useReducer, useRef } from 'react';
import { answerOptions } from '../config/answerOptions.js';
import { domains, questions, getQuestionsByDomain } from '../utils/questionBank.js';

const validAnswer = (value) => answerOptions.some((option) => option.id === value);
const domainComplete = (answers, domainId) => getQuestionsByDomain(domainId).every((q) => validAnswer(answers[q.id]));
const canVisit = (answers, step) => Number.isInteger(step) && step >= 0 && step < domains.length
  && domains.slice(0, step).every((domain) => domainComplete(answers, domain.id));
const initialState = () => ({
  stage: 'intro', organisationName: '', assessorName: '', answers: {}, currentStep: 0, startedAt: '',
});

// Only restore known question IDs and valid answers, even if someone edited draft.json.
export function restoreDraft(draft) {
  const answers = Object.fromEntries(questions.filter((q) => validAnswer(draft?.answers?.[q.id]))
    .map((q) => [q.id, draft.answers[q.id]]));
  const firstIncomplete = domains.findIndex((domain) => !domainComplete(answers, domain.id));
  const limit = firstIncomplete === -1 ? domains.length - 1 : firstIncomplete;
  const currentStep = Number.isInteger(draft?.currentStep) ? Math.max(0, Math.min(draft.currentStep, limit)) : 0;
  return {
    stage: draft?.stage === 'review' && firstIncomplete === -1 ? 'review' : 'questions',
    organisationName: typeof draft?.organisationName === 'string' ? draft.organisationName.slice(0, 100) : '',
    assessorName: typeof draft?.assessorName === 'string' ? draft.assessorName : '',
    answers, currentStep,
    startedAt: typeof draft?.startedAt === 'string' && Number.isFinite(Date.parse(draft.startedAt))
      ? draft.startedAt : new Date().toISOString(),
  };
}

export function assessmentReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return ['organisationName', 'assessorName'].includes(action.field)
        ? { ...state, [action.field]: action.value } : state;
    case 'ANSWER':
      return questions.some((q) => q.id === action.questionId) && validAnswer(action.value)
        ? { ...state, answers: { ...state.answers, [action.questionId]: action.value } } : state;
    case 'NEXT':
      if (state.stage === 'intro') return state.organisationName.trim()
        ? { ...state, organisationName: state.organisationName.trim(), stage: 'questions', startedAt: new Date().toISOString() } : state;
      if (state.stage !== 'questions' || !domainComplete(state.answers, domains[state.currentStep].id)) return state;
      return state.currentStep === domains.length - 1
        ? { ...state, stage: 'review' } : { ...state, currentStep: state.currentStep + 1 };
    case 'BACK':
      return { ...state, stage: 'questions', currentStep: state.stage === 'review' ? domains.length - 1 : Math.max(0, state.currentStep - 1) };
    case 'GO_TO_STEP':
      return canVisit(state.answers, action.step) ? { ...state, stage: 'questions', currentStep: action.step } : state;
    case 'GO_TO_REVIEW':
      return domains.every((domain) => domainComplete(state.answers, domain.id)) ? { ...state, stage: 'review' } : state;
    case 'RESUME': return restoreDraft(action.draft);
    case 'RESET': return initialState();
    case 'COMPLETE': return { ...state, stage: 'completed' };
    default: return state;
  }
}

export default function useAssessment() {
  const [state, dispatch] = useReducer(assessmentReducer, undefined, initialState);
  const timer = useRef(null);
  const latestDraft = useRef(null);
  const savingPaused = useRef(false);

  async function saveDraft(draft) {
    if (!window.api?.saveDraft) return;
    // A failed disk write should never discard the answers in memory.
    try {
      // Invoke immediately so a normal window close can send its pending edit.
      const result = await window.api.saveDraft(draft);
      if (!result.ok) console.warn('Could not auto-save assessment:', result.error);
    } catch (error) { console.warn('Could not auto-save assessment:', error.message); }
  }

  useEffect(() => {
    clearTimeout(timer.current);
    if (state.stage === 'intro') savingPaused.current = false;
    if (!['questions', 'review'].includes(state.stage) || savingPaused.current) {
      latestDraft.current = null;
      return;
    }
    latestDraft.current = { ...state, savedAt: new Date().toISOString() };
    timer.current = setTimeout(() => {
      if (!savingPaused.current) saveDraft(latestDraft.current);
      latestDraft.current = null;
    }, 500);
    return () => clearTimeout(timer.current);
  }, [state]);

  useEffect(() => {
    // Flush a pending edit when leaving the page or closing the window normally.
    const flush = () => {
      clearTimeout(timer.current);
      if (latestDraft.current && !savingPaused.current) {
        saveDraft(latestDraft.current);
        latestDraft.current = null;
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, []);

  function pauseAutoSave() {
    savingPaused.current = true;
    clearTimeout(timer.current);
    latestDraft.current = null;
  }
  function restartAutoSave() {
    savingPaused.current = false;
    saveDraft({ ...state, savedAt: new Date().toISOString() });
  }

  const answeredCount = questions.filter((q) => validAnswer(state.answers[q.id])).length;
  return {
    state, dispatch, answeredCount, totalCount: questions.length,
    percentComplete: Math.round(answeredCount / questions.length * 100),
    isDomainComplete: (domainId) => domainComplete(state.answers, domainId),
    canVisitStep: (step) => canVisit(state.answers, step),
    allComplete: answeredCount === questions.length,
    pauseAutoSave, restartAutoSave,
  };
}
