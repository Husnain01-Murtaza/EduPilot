// Percentage -> 4.0 scale. Adjust to your university's grading policy.
const percentToGpa = (p) => {
  if (p >= 85) return 4.0;
  if (p >= 80) return 3.67;
  if (p >= 75) return 3.33;
  if (p >= 70) return 3.0;
  if (p >= 65) return 2.67;
  if (p >= 60) return 2.33;
  if (p >= 55) return 2.0;
  if (p >= 50) return 1.67;
  return 0;
};

// grades: [{component, score, maxScore}], weights: { quiz: 10, midterm: 30, ... }
const coursePercentage = (grades, weights = {}) => {
  const groups = {};
  grades.forEach((g) => {
    (groups[g.component] = groups[g.component] || []).push((g.score / g.maxScore) * 100);
  });
  const hasWeights = Object.values(weights || {}).some((v) => Number(v) > 0);
  const componentAverages = {};
  let sum = 0;
  let totalWeight = 0;
  Object.entries(groups).forEach(([component, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    componentAverages[component] = avg;
    const w = hasWeights ? Number(weights[component]) || 0 : 1;
    sum += avg * w;
    totalWeight += w;
  });
  const percentage = totalWeight > 0 ? sum / totalWeight : 0;
  return { percentage, gpa: percentToGpa(percentage), componentAverages };
};

module.exports = { percentToGpa, coursePercentage };
