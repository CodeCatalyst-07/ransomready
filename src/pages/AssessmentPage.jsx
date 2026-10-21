import { domainIcons, fallbackDomainIcon } from '../config/domainIcons.js';
import { domains, getQuestionsByDomain, getTotalQuestionCount } from '../utils/questionBank.js';

// Temporary, read-only Phase 3 preview; the assessment wizard arrives in Phase 4.
export default function AssessmentPage() {
  return (
    <section className="page-stack" aria-labelledby="question-bank-title">
      <div className="card question-bank-intro">
        <span className="phase-badge">Temporary preview · Phase 3</span>
        <h2 id="question-bank-title">Question bank preview</h2>
        <p>Explore the areas covered by the question bank; the full assessment wizard arrives in Phase 4.</p>
        <p className="question-bank-total"><strong>{getTotalQuestionCount()} questions</strong> across {domains.length} domains</p>
      </div>
      <div className="domain-grid">
        {domains.map((domain) => {
          const Icon = domainIcons[domain.id] ?? fallbackDomainIcon;
          return (
            <article className="card feature-card domain-card" key={domain.id}>
              <div className="icon-tile"><Icon size={24} aria-hidden="true" /></div>
              <h3>{domain.name}</h3>
              <p>{domain.description}</p>
              <p className="domain-question-count">{getQuestionsByDomain(domain.id).length} questions</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
