// Keep in sync with backend/src/utils/gpa.js
export const percentToGpa = (p) => {
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

// averages: { quiz: 80, ... }, weights: { quiz: 20, ... }
export const weightedPercentage = (averages, weights = {}) => {
  const hasWeights = Object.values(weights || {}).some((v) => Number(v) > 0);
  let sum = 0;
  let total = 0;
  Object.entries(averages).forEach(([k, avg]) => {
    const w = hasWeights ? Number(weights[k]) || 0 : 1;
    sum += Number(avg) * w;
    total += w;
  });
  return total > 0 ? sum / total : 0;
};

export const cgpaFrom = (courses) => {
  let points = 0;
  let credits = 0;
  courses.forEach((c) => {
    points += percentToGpa(c.percentage) * c.credits;
    credits += c.credits;
  });
  return credits ? points / credits : 0;
};
