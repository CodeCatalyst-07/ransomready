import { getLevelForPercent } from '../config/maturityLevels.js';

export function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

// Pure calculation: all question data and answers come from the caller.
export function calculateScores(input = {}) {
  const { answers, domains, questions, answerOptions } = input ?? {};
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)
    || !Array.isArray(domains) || domains.length === 0
    || !Array.isArray(questions) || questions.length === 0
    || !Array.isArray(answerOptions) || answerOptions.length === 0) {
    throw new Error('Scoring requires answers, domains, questions and answerOptions.');
  }

  const optionsById = new Map(answerOptions.map((option) => [option.id, option]));
  const domainResults = [...domains].sort((a, b) => a.order - b.order).map((domain) => ({
    id: domain.id, name: domain.name, order: domain.order,
    points: 0, maxPoints: 0, questionCount: 0, gapCount: 0, criticalGapCount: 0,
  }));
  const domainsById = new Map(domainResults.map((domain) => [domain.id, domain]));
  const stats = { totalQuestions: questions.length, yes: 0, partial: 0, no: 0, unsure: 0, criticalGaps: 0 };
  const recommendations = [];
  const priorities = { 3: 'High', 2: 'Medium', 1: 'Low' };

  for (const question of questions) {
    if (!Object.hasOwn(answers, question.id) || answers[question.id] == null) {
      throw new Error(`Missing answer for question ${question.id}.`);
    }
    const answer = answers[question.id];
    const option = optionsById.get(answer);
    if (!option) throw new Error(`Invalid answer for question ${question.id}: ${String(answer)}.`);

    const domain = domainsById.get(question.domainId);
    if (!domain) throw new Error(`Unknown domain for question ${question.id}.`);
    domain.points += question.weight * option.score;
    domain.maxPoints += question.weight;
    domain.questionCount += 1;
    stats[answer] += 1;

    // Partial protection is a gap, but only No / Not sure on weight 3 is critical.
    if (question.weight === 3 && (answer === 'no' || answer === 'unsure')) {
      domain.criticalGapCount += 1;
      stats.criticalGaps += 1;
    }
    if (answer !== 'yes') {
      domain.gapCount += 1;
      recommendations.push({
        questionId: question.id, domainId: domain.id, domainName: domain.name,
        questionText: question.text, recommendation: question.recommendation,
        weight: question.weight, answer, priority: priorities[question.weight],
        priorityScore: question.weight * (1 - option.score),
      });
    }
  }

  let points = 0;
  let maxPoints = 0;
  for (const domain of domainResults) {
    points += domain.points;
    maxPoints += domain.maxPoints;
    domain.percent = domain.maxPoints === 0 ? 0 : roundToOneDecimal(domain.points / domain.maxPoints * 100);
    domain.level = getLevelForPercent(domain.percent);
  }
  // Overall uses raw points, never an average of the rounded domain percents.
  const percent = roundToOneDecimal(points / maxPoints * 100);
  const uncappedLevel = getLevelForPercent(percent);
  const capped = stats.criticalGaps >= 3 && uncappedLevel.level > 2;
  const level = capped ? getLevelForPercent(25) : uncappedLevel;
  const cappedReason = capped
    ? `Level limited to Developing because ${stats.criticalGaps} critical gaps remain.` : '';

  recommendations.sort((a, b) => b.priorityScore - a.priorityScore
    || b.weight - a.weight
    || domainsById.get(a.domainId).order - domainsById.get(b.domainId).order
    || (a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0));

  return {
    overall: { percent, points, maxPoints, level, uncappedLevel, capped, cappedReason },
    domains: domainResults, recommendations, stats,
  };
}
