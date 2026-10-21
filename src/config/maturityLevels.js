export const maturityLevels = [
  { level: 1, name: 'Initial', min: 0, max: 24.9, tone: 'danger', description: 'Highly vulnerable: basic ransomware defences are missing.' },
  { level: 2, name: 'Developing', min: 25, max: 49.9, tone: 'danger', description: 'Some defences exist, but major gaps remain.' },
  { level: 3, name: 'Defined', min: 50, max: 69.9, tone: 'warning', description: 'Core defences are in place, but important gaps remain.' },
  { level: 4, name: 'Managed', min: 70, max: 84.9, tone: 'success', description: 'Strong defences with a few gaps to close.' },
  { level: 5, name: 'Resilient', min: 85, max: 100, tone: 'success', description: 'Well prepared; keep testing and improving.' },
];

// Callers pass the already-rounded percent so the displayed number and level agree.
export function getLevelForPercent(percent) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error('Maturity percent must be a number between 0 and 100.');
  }
  return maturityLevels.findLast((level) => percent >= level.min);
}
