import { domains } from '../../utils/questionBank.js';
import { domainIcons, fallbackDomainIcon } from '../../config/domainIcons.js';

export default function StepIndicator({ currentStep, isDomainComplete, canVisitStep, onGoToStep }) {
  return (
    <nav aria-label="Assessment domains"><ol className="assessment-steps">
      {domains.map((domain, index) => {
        const Icon = domainIcons[domain.id] ?? fallbackDomainIcon;
        const complete = isDomainComplete(domain.id);
        return (
          <li key={domain.id}>
            <button className={`step-button${complete ? ' complete' : ''}`} disabled={!canVisitStep(index)}
              aria-current={currentStep === index ? 'step' : undefined}
              aria-label={`${index + 1}. ${domain.name}: ${complete ? 'complete' : 'incomplete'}`}
              title={domain.name} onClick={() => onGoToStep(index)}>
              <Icon size={21} aria-hidden="true" /><span>{index + 1}{complete ? ' ✓' : ''}</span>
            </button>
          </li>
        );
      })}
    </ol></nav>
  );
}
