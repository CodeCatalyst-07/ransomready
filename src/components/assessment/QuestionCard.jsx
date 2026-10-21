import { answerOptions } from '../../config/answerOptions.js';

export default function QuestionCard({ question, answer, onAnswer, number }) {
  return (
    <article className="card question-card">
      <fieldset>
        <legend><span className="question-number">Question {number}</span>{question.text}</legend>
        {question.weight === 3 && <span className="critical-badge">Critical</span>}
        <div className="answer-options">
          {answerOptions.map((option) => (
            <label key={option.id} className={`answer-option${answer === option.id ? ' selected' : ''}`}>
              <input type="radio" name={question.id} value={option.id} checked={answer === option.id}
                onChange={() => onAnswer(question.id, option.id)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <details><summary>Why this matters</summary><p>{question.why}</p></details>
    </article>
  );
}
