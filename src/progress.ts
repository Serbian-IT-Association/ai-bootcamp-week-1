/**
 * A snapshot of interview-preparation progress, derived purely from a
 * completed and total item count. Kept as a plain exported function
 * rather than a class (see `AGENTS.md` section 1): it owns no state and
 * has no lifecycle, so a class would add structure without a purpose.
 */
interface ProgressSummary {

  completedCount: number;
  totalCount: number;
  percentage: number;
  message: string;
}

/**
 * Computes the progress summary shown in the progress panel from the
 * number of completed items out of the total.
 *
 * Percentage is rounded with `Math.round`, which rounds a `.5` value up
 * (for example 1 completed out of 8 is 12.5%, reported as 13%, not 12%) —
 * this matters because the panel shows a single whole-number percentage.
 *
 * @param completedCount - How many preparation items are currently checked.
 * @param totalCount - The total number of preparation items.
 * @returns The completed/total counts, the rounded percentage, and a
 *   status message appropriate to the current progress.
 */
function calculateProgress(completedCount: number, totalCount: number): ProgressSummary {

  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const message = determineProgressMessage(completedCount, totalCount);

  return { completedCount, totalCount, percentage, message };
}

/**
 * @param completedCount - How many preparation items are currently checked.
 * @param totalCount - The total number of preparation items.
 * @returns A status message appropriate to the current progress: none
 *   started, some but not all, or every item completed.
 */
function determineProgressMessage(completedCount: number, totalCount: number): string {

  if (completedCount === 0) {

    return "Počni pripremu";
  }

  if (completedCount === totalCount) {

    return "Spreman/na si za intervju!";
  }

  return "Nastavi, dobro ti ide";
}

export { calculateProgress };
export type { ProgressSummary };
