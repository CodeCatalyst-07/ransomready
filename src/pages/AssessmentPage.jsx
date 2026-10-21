import { useEffect, useRef, useState } from 'react';
import useAssessment from '../hooks/useAssessment.js';
import { domains } from '../utils/questionBank.js';
import IntroScreen from '../components/assessment/IntroScreen.jsx';
import DomainStep from '../components/assessment/DomainStep.jsx';
import ProgressBar from '../components/assessment/ProgressBar.jsx';
import StepIndicator from '../components/assessment/StepIndicator.jsx';
import ReviewScreen from '../components/assessment/ReviewScreen.jsx';
import CompletedScreen from '../components/assessment/CompletedScreen.jsx';
import '../styles/assessment.css';

export default function AssessmentPage() {
  const assessment = useAssessment();
  const { state, dispatch, allComplete, isDomainComplete } = assessment;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);
  const screen = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    screen.current?.focus();
    screen.current?.scrollIntoView({ block: 'start' });
  }, [state.stage, state.currentStep]);

  async function submit() {
    if (!allComplete || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    assessment.pauseAutoSave();
    try {
      const { organisationName, assessorName, startedAt, answers } = state;
      const result = await window.api.saveAssessment({ organisationName, assessorName, startedAt, answers });
      if (!result.ok) throw new Error(result.error);
    } catch (error) {
      setError(`Could not save the assessment: ${error.message}. Your answers are still here. Please try again.`);
      assessment.restartAutoSave();
      setBusy(false);
      submitting.current = false;
      return;
    }
    try {
      const cleared = await window.api.clearDraft();
      if (!cleared.ok) throw new Error(cleared.error);
    } catch (error) {
      setNotice(`Assessment saved, but the draft could not be removed: ${error.message}. Use “Start another assessment” to retry cleanup.`);
    }
    dispatch({ type: 'COMPLETE' });
    setBusy(false);
    submitting.current = false;
  }

  async function reset() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const result = await window.api.clearDraft();
      if (!result.ok) throw new Error(result.error);
      setNotice('');
      setError('');
      dispatch({ type: 'RESET' });
    } catch (error) { setNotice(`Could not clear the old draft: ${error.message}. Please try again.`); }
    finally { submitting.current = false; }
  }

  if (!window.api) return (
    <section className="card assessment-panel"><h2>Open RansomReady on your desktop</h2>
      <p>The assessment saves privately on this computer through the desktop app. Open the Electron app to start or resume an assessment.</p></section>
  );
  return (
    <div className="assessment-wizard page-stack" ref={screen} tabIndex={-1} aria-label="Assessment questionnaire" aria-busy={busy}>
      {state.stage === 'intro' && <IntroScreen state={state} dispatch={dispatch} />}
      {['questions', 'review'].includes(state.stage) && (
        <div className="card assessment-overview">
          <ProgressBar {...assessment} />
          <StepIndicator currentStep={state.stage === 'questions' ? state.currentStep : -1}
            isDomainComplete={isDomainComplete} canVisitStep={(step) => !busy && assessment.canVisitStep(step)}
            onGoToStep={(step) => dispatch({ type: 'GO_TO_STEP', step })} />
          <p className="shell-note">Progress is saved automatically on this computer.</p>
        </div>
      )}
      {state.stage === 'questions' && <>
        <DomainStep key={state.currentStep} domain={domains[state.currentStep]} step={state.currentStep} answers={state.answers}
          onAnswer={(questionId, value) => dispatch({ type: 'ANSWER', questionId, value })} />
        <div className="assessment-navigation">
          <button className="secondary-button" disabled={state.currentStep === 0} onClick={() => dispatch({ type: 'BACK' })}>Back</button>
          <div>{!isDomainComplete(domains[state.currentStep].id) && <p id="next-help" className="shell-note">Answer all 4 questions to continue</p>}
            <button className="primary-button" disabled={!isDomainComplete(domains[state.currentStep].id)} aria-describedby={!isDomainComplete(domains[state.currentStep].id) ? 'next-help' : undefined}
              onClick={() => dispatch({ type: 'NEXT' })}>{state.currentStep === domains.length - 1 ? 'Review' : 'Next'}</button>
          </div>
        </div>
      </>}
      {state.stage === 'review' && <ReviewScreen state={state} allComplete={allComplete} busy={busy} error={error}
        onEdit={(step) => dispatch({ type: 'GO_TO_STEP', step })} onBack={() => dispatch({ type: 'BACK' })} onSubmit={submit} />}
      {state.stage === 'completed' && <CompletedScreen onReset={reset} notice={notice} />}
    </div>
  );
}
