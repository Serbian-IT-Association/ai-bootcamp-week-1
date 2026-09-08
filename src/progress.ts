/** Values needed to render the current preparation progress. */
type Progress = {
  completed: number;
  total: number;
  percentage: number;
  message: string;
};

/**
 * Calculates the display values for the current preparation progress.
 *
 * @param completed - Number of completed preparation items.
 * @param total - Total number of preparation items.
 * @returns The values and status message shown in the progress panel.
 */
function calculateProgress(completed: number, total: number): Progress {

  const percentage = Math.round((completed / total) * 100);
  let message = "Samo napred";

  if (completed === 0) {

    message = "Počni pripremu";
  }
  else if (completed === total) {

    message = "Spreman/na si za intervju!";
  }

  return {
    completed,
    total,
    percentage,
    message,
  };
}

export { calculateProgress };
export type { Progress };
