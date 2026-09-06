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
 * @throws {Error} When `totalCount` is not a positive integer, or when
 *   `completedCount` is not an integer between `0` and `totalCount`.
 */
function calculateProgress(completedCount: number, totalCount: number): ProgressSummary {

  validateCounts(completedCount, totalCount);

  const percentage = Math.round((completedCount / totalCount) * 100);
  const message = determineProgressMessage(completedCount, totalCount, percentage);

  return { completedCount, totalCount, percentage, message };
}

/**
 * Validates that the given counts describe a real progress state, so a
 * caller mistake (a negative count, a non-integer, or more completed
 * items than total) fails immediately with a clear message instead of
 * silently producing a nonsensical percentage.
 *
 * @param completedCount - How many preparation items are currently checked.
 * @param totalCount - The total number of preparation items.
 * @throws {Error} When either count is invalid, as described above.
 */
function validateCounts(completedCount: number, totalCount: number): void {

  if (!Number.isInteger(totalCount) || totalCount <= 0) {

    throw new Error(`calculateProgress: totalCount must be a positive integer, got ${totalCount}.`);
  }

  const isCompletedCountInteger = Number.isInteger(completedCount);
  const isCompletedCountInRange = completedCount >= 0 && completedCount <= totalCount;

  if (!isCompletedCountInteger || !isCompletedCountInRange) {

    throw new Error(`calculateProgress: completedCount must be an integer between 0 and ${totalCount}, got ${completedCount}.`);
  }
}

/** Percentage from which progress is considered far enough along to call out separately. */
const NEARLY_DONE_PERCENTAGE_THRESHOLD = 50;

/**
 * @param completedCount - How many preparation items are currently checked.
 * @param totalCount - The total number of preparation items.
 * @param percentage - The rounded percentage already computed for this
 *   count, so the halfway threshold below is judged on the same number
 *   the panel displays.
 * @returns A status message appropriate to the current progress: none
 *   started, under halfway, halfway or more, or every item completed.
 */
function determineProgressMessage(completedCount: number, totalCount: number, percentage: number): string {

  if (completedCount === 0) {

    return "Počni pripremu";
  }

  if (completedCount === totalCount) {

    return "Spreman/na si za intervju!";
  }

  if (percentage >= NEARLY_DONE_PERCENTAGE_THRESHOLD) {

    return "Skoro gotovo!";
  }

  return "Nastavi, dobro ti ide";
}

export { calculateProgress };
export type { ProgressSummary };
