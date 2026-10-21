export const answerOptions = [
  { id: 'yes', label: 'Yes, fully in place', score: 1 },
  { id: 'partial', label: 'Partially in place', score: 0.5 },
  { id: 'no', label: 'No', score: 0 },
  // Counts as 0 because not knowing is itself a gap.
  { id: 'unsure', label: 'Not sure', score: 0 },
];
