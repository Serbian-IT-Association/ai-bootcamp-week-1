/** The values rendered for the current checklist progress. */
type ProgressResult = {
  completed: number;
  total: number;
  percentage: number;
  message: string;
};

/** Error thrown when progress input cannot describe a valid checklist. */
class InvalidProgressError extends Error {

  /**
   * @param message - Explanation of the invalid progress input.
   */
  constructor(message: string) {

    super(message);
    this.name = "InvalidProgressError";
  }
}

/**
 * Calculates the completion percentage and message for a checklist.
 *
 * @param completed - Number of completed items.
 * @param total - Total number of items.
 * @returns The normalized progress values for the page.
 * @throws {InvalidProgressError} When either value is not a valid checklist count.
 */
function calculateProgress(completed: number, total: number): ProgressResult {

  if (!Number.isInteger(completed) || !Number.isInteger(total)) {

    throw new InvalidProgressError("Progress counts must be integers");
  }

  if (total <= 0 || completed < 0 || completed > total) {

    throw new InvalidProgressError("Completed items must be between zero and the total");
  }

  const percentage = Math.round((completed / total) * 100);
  const message = getProgressMessage(completed, total);

  return {
    completed,
    total,
    percentage,
    message,
  };
}

/**
 * Selects the required message for the current checklist state.
 *
 * @param completed - Number of completed items.
 * @param total - Total number of items.
 * @returns The message for the current state.
 */
function getProgressMessage(completed: number, total: number): string {

  if (completed === 0) {

    return "Počni pripremu";
  }

  if (completed === total) {

    return "Spreman/na si za intervju";
  }

  return "Na dobrom si putu";
}

export { calculateProgress, InvalidProgressError };
export type { ProgressResult };