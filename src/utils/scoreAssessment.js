import { domains, questions } from './questionBank.js';
import { answerOptions } from '../config/answerOptions.js';
import { calculateScores } from './scoring.js';

// Keep bundled data wiring here so the engine can also run directly in Node.
export function scoreAssessment(answers) {
  return calculateScores({ answers, domains, questions, answerOptions });
}
