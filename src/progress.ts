/**
 * Values needed to display checklist progress.
 */
export type ProgressResult = {
  completed: number;
  percentage: number;
  message: string;
};

/**
 * Calculates checklist progress without reading or changing page state.
 *
 * @param completed - Number of completed preparation items.
 * @param total - Total number of preparation items.
 * @returns The completed count, rounded percentage, and matching message.
 * @throws {Error} When the counts cannot represent a valid progress state.
 */
function calculateProgress(completed: number, total: number): ProgressResult {

  if (!Number.isInteger(completed)) {

    throw new Error("calculateProgress: completed must be an integer.");
  }

  if (!Number.isInteger(total)) {

    throw new Error("calculateProgress: total must be an integer.");
  }

  if (total <= 0) {

    throw new Error("calculateProgress: total must be greater than zero.");
  }

  if (completed < 0) {

    throw new Error("calculateProgress: completed must be greater than or equal to zero.");
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

export { calculateProgress };
