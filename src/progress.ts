/** Numeric progress, independent of display formatting and persistence. */
export type Progress = {
  completed: number;
  total: number;
  percentage: number;
};

/**
 * Calculates a percentage without rounding. Counts must be integers,
 * with a positive total and completed between zero and total, inclusive.
 */
export function calculateProgress(completed: number, total: number): Progress {

  if (!Number.isInteger(total) || total <= 0) {

    throw new Error("calculateProgress: total must be a positive integer.");
  }

  const isCompletedInteger = Number.isInteger(completed);
  const isCompletedInRange = completed >= 0 && completed <= total;

  if (!isCompletedInteger || !isCompletedInRange) {

    throw new Error("calculateProgress: completed must be an integer between zero and total.");
  }

  return { completed, total, percentage: completed / total * 100 };
}
