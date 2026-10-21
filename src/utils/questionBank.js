import domainData from '../data/domains.json';
import questionData from '../data/questions.json';

export const domains = [...domainData].sort((a, b) => a.order - b.order);
export const questions = questionData;

// Return the questions belonging to a domain, or an empty array for an unknown domain.
export function getQuestionsByDomain(domainId) {
  return questions.filter((question) => question.domainId === domainId);
}

// Find a question by its unique ID, or return undefined if it is unknown.
export function getQuestionById(id) {
  return questions.find((question) => question.id === id);
}

// Find a domain by its ID, or return undefined if it is unknown.
export function getDomainById(id) {
  return domains.find((domain) => domain.id === id);
}

// Return the number of questions bundled with the app.
export function getTotalQuestionCount() {
  return questions.length;
}
