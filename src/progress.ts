/** Values used to render the current interview-preparation progress. */
interface ProgressSummary {

  completedCount: number;
  totalCount: number;
  percentage: number;
  message: string;
}

/**
 * Calculates display-ready progress from completed and total item counts.
 *
 * @param completedCount - Number of preparation items currently completed.
 * @param totalCount - Total number of available preparation items.
 * @returns Counts, a rounded whole-number percentage, and a status message.
 * @throws {Error} When the counts cannot represent a valid progress state.
 */
function calculateProgress(completedCount: number, totalCount: number): ProgressSummary {

  validateProgressCounts(completedCount, totalCount);

  const percentage = Math.round((completedCount / totalCount) * 100);
  const message = determineProgressMessage(completedCount, totalCount);

  return {
    completedCount,
    totalCount,
    percentage,
    message
  };
}

/**
 * Rejects progress counts that would produce an impossible state.
 *
 * @param completedCount - Number of preparation items currently completed.
 * @param totalCount - Total number of available preparation items.
 */
function validateProgressCounts(completedCount: number, totalCount: number): void {

  const hasValidTotalCount = Number.isInteger(totalCount) && totalCount > 0;

  if (!hasValidTotalCount) {

    throw new Error(`calculateProgress: totalCount must be a positive integer, got ${totalCount}.`);
  }

  const hasIntegerCompletedCount = Number.isInteger(completedCount);
  const hasCompletedCountInRange = completedCount >= 0 && completedCount <= totalCount;

  if (!hasIntegerCompletedCount || !hasCompletedCountInRange) {

    throw new Error(
      `calculateProgress: completedCount must be an integer between 0 and ${totalCount}, got ${completedCount}.`
    );
  }
}

/**
 * Selects the user-facing message for the current progress stage.
 *
 * @param completedCount - Number of preparation items currently completed.
 * @param totalCount - Total number of available preparation items.
 * @returns The message associated with the current progress stage.
 */
function determineProgressMessage(
  completedCount: number,
  totalCount: number
): string {

  if (completedCount === 0) {

    return "Počni pripremu";
  }

  if (completedCount === totalCount) {

    return "Spreman/na si za intervju";
  }

  return "Na dobrom si putu";
}

export { calculateProgress };
export type { ProgressSummary };
