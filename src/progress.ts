/** Values needed to display checklist progress. */
export type ProgressResult = {
  completed: number;
  percentage: number;
  message: string;
};

/**
 * Calculates progress without reading or changing page state.
 * @param completed - Whole number of finished items, from zero to total.
 * @param total - Positive whole number of available items.
 * @returns Progress with a percentage rounded to the nearest integer.
 * @throws Error when either count is invalid or completed exceeds total.
 */
export function calculateProgress(completed: number, total: number): ProgressResult {

  if (!Number.isInteger(total) || total <= 0) {

    throw new Error("calculateProgress: total must be a positive integer.");
  }

  if (!Number.isInteger(completed) || completed < 0) {

    throw new Error("calculateProgress: completed must be a non-negative integer.");
  }

  if (completed > total) {

    throw new Error("calculateProgress: completed must not exceed total.");
  }

  const percentage = Math.round((completed / total) * 100);
  let message = "Na dobrom si putu";

  if (completed === 0) {

    message = "Počni pripremu";
  }
  else if (completed === total) {

    message = "Spreman/na si za intervju";
  }

  return { completed, percentage, message };
}
