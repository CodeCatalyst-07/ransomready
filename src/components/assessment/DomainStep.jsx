import { domainIcons, fallbackDomainIcon } from '../../config/domainIcons.js';
import { getQuestionsByDomain } from '../../utils/questionBank.js';
import QuestionCard from './QuestionCard.jsx';

export default function DomainStep({ domain, step, answers, onAnswer }) {
  const Icon = domainIcons[domain.id] ?? fallbackDomainIcon;
  return (
    <section className="page-stack" aria-labelledby="domain-title">
      <div className="domain-heading">
        <div className="icon-tile"><Icon size={26} aria-hidden="true" /></div>
        <div><p className="eyebrow">DOMAIN {step + 1} OF 8</p><h2 id="domain-title">{domain.name}</h2><p>{domain.description}</p></div>
      </div>
      {getQuestionsByDomain(domain.id).map((question, index) => (
        <QuestionCard key={question.id} question={question} number={index + 1} answer={answers[question.id]} onAnswer={onAnswer} />
      ))}
    </section>
  );
}
