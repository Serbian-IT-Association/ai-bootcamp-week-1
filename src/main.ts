import { CompletedItemsStore } from "./storage.ts";

/** Total number of preparation checkboxes required by the HTML contract. */
const TOTAL_ITEMS = 8;

/** Summary of the current completion state, ready to render into the DOM. */
type ProgressSummary = {
  completedCount: number;
  percentage: number;
  text: string;
  percentageText: string;
  statusMessage: string;
  message: string;
};

/**
 * Computes the current completed count and the textual/progress values to
 * render for the given checklist state.
 *
 * @param completedCount - The number of checked items.
 * @param totalItems - The total number of checklist items.
 * @returns The progress summary for the current state.
 */
function calculateProgress(completedCount: number, totalItems: number): ProgressSummary {

  const safeTotalItems = totalItems > 0 ? totalItems : 0;
  const safeCompletedCount = Math.max(0, Math.min(completedCount, safeTotalItems));
  const percentage = safeTotalItems === 0 ? 0 : Math.round((safeCompletedCount / safeTotalItems) * 100);
  const text = `${safeCompletedCount} od ${safeTotalItems} završeno`;
  const percentageText = `${percentage}%`;
  const statusMessage = getStatusMessage(safeCompletedCount, safeTotalItems);

  return {
    completedCount: safeCompletedCount,
    percentage,
    text,
    percentageText,
    statusMessage,
    message: statusMessage,
  };
}

/**
 * Derives a human-friendly status for the completion state.
 *
 * @param completedCount - The number of checked items.
 * @param totalItems - The total number of checklist items.
 * @returns A short status message suitable for the progress panel.
 */
function getStatusMessage(completedCount: number, totalItems: number): string {

  if (completedCount === 0) {

    return "Počni pripremu!";
  }

  const percentage = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);

  if (percentage > 0 && percentage < 50) {

    return "U toku...";
  }

  if (percentage >= 50 && percentage < 70) {

    return "Polovina je završena!";
  }

  if (percentage >= 70 && percentage < 100) {

    return "Skoro si spreman/a!";
  }

  return "Priprema je završena!";
}

export { calculateProgress };

/**
 * Thrown when the page markup does not match the HTML contract this module
 * depends on (project-specification.md section 8), so a broken page fails
 * with a clear message instead of silently doing nothing.
 */
class MissingElementError extends Error {

  /**
   * @param elementDescription - Human-readable description of the missing
   *   element, used to build the error message.
   */
  constructor(elementDescription: string) {

    super(`InterviewPreparationPage: required element not found: ${elementDescription}`);
    this.name = "MissingElementError";
  }
}

/**
 * Keeps the eight interview-preparation checkboxes in sync with
 * `localStorage` through `storage.ts`, per the persistence contract in
 * project-specification.md section 9. Connecting the progress display and
 * the reset button to this state is this project's task; see
 * `README-sr.md`.
 */
class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly completedItemsStore: CompletedItemsStore;
  private readonly resetButton: HTMLButtonElement;
  private readonly progressText: HTMLElement;
  private readonly progressPercentage: HTMLElement;
  private readonly progressBar: HTMLProgressElement;
  private readonly progressMessage: HTMLElement;

  /**
   * Reads and validates the eight preparation checkboxes. Throws
   * immediately when the HTML contract is broken, rather than failing
   * later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.completedItemsStore = new CompletedItemsStore();
    this.resetButton = this.findResetButton();
    this.progressText = this.findProgressText();
    this.progressPercentage = this.findProgressPercentage();
    this.progressBar = this.findProgressBar();
    this.progressMessage = this.findProgressMessage();
  }

  /**
   * Restores any previously saved checked state, then wires persistence so
   * further changes are saved. Call once, after construction.
   */
  public start(): void {

    const page = this;

    function onCheckboxChange(): void {

      page.persistCheckedState();
      page.renderProgress();
    }

    function onResetClick(): void {

      page.resetCheckedState();
      page.renderProgress();
    }

    this.restoreCheckedState();
    this.renderProgress();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetClick);
  }

  /**
   * Finds the eight preparation checkboxes through the `data-prep-item`
   * contract and validates that exactly eight exist.
   *
   * @returns The checkbox elements, in document order.
   */
  private findCheckboxes(): HTMLInputElement[] {

    const candidateElements = document.querySelectorAll("[data-prep-item]");
    const checkboxes: HTMLInputElement[] = [];

    for (const candidateElement of candidateElements) {

      if (candidateElement instanceof HTMLInputElement && candidateElement.type === "checkbox") {

        checkboxes.push(candidateElement);
      }
    }

    if (checkboxes.length !== TOTAL_ITEMS) {

      throw new MissingElementError(`exactly ${TOTAL_ITEMS} '[data-prep-item]' checkboxes (found ${checkboxes.length})`);
    }

    return checkboxes;
  }

  /**
   * Finds the Reset button required by the HTML contract.
   *
   * @returns The button that clears the completed preparation state.
   */
  private findResetButton(): HTMLButtonElement {

    const element = document.getElementById("reset-progress");

    if (!(element instanceof HTMLButtonElement)) {

      throw new MissingElementError("#reset-progress");
    }

    return element;
  }

  /**
   * Applies any previously saved checked state to the checkboxes. Call
   * before attaching listeners so restoring state cannot trigger a
   * `change` event.
   */
  private restoreCheckedState(): void {

    const persistedIds = this.completedItemsStore.load();

    for (const checkbox of this.checkboxes) {

      checkbox.checked = persistedIds.includes(checkbox.id);
    }
  }

  /**
   * Finds the progress text element required by the HTML contract.
   *
   * @returns The element that shows the count like "0 od 8 završeno".
   */
  private findProgressText(): HTMLElement {

    const element = document.getElementById("progress-text");

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError("#progress-text");
    }

    return element;
  }

  /**
   * Finds the percentage element required by the HTML contract.
   *
   * @returns The element that shows the completion percent.
   */
  private findProgressPercentage(): HTMLElement {

    const element = document.getElementById("progress-percentage");

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError("#progress-percentage");
    }

    return element;
  }

  /**
   * Finds the progress bar required by the HTML contract.
   *
   * @returns The DOM progress element.
   */
  private findProgressBar(): HTMLProgressElement {

    const element = document.getElementById("progress-bar");

    if (!(element instanceof HTMLProgressElement)) {

      throw new MissingElementError("#progress-bar");
    }

    return element;
  }

  /**
   * Finds the status message element required by the HTML contract.
   *
   * @returns The element that shows the textual completion status.
   */
  private findProgressMessage(): HTMLElement {

    const element = document.getElementById("progress-message");

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError("#progress-message");
    }

    return element;
  }

  /**
   * Counts the currently checked items.
   *
   * @returns The number of checked preparation items.
   */
  private countCheckedItems(): number {

    let checkedCount = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        checkedCount += 1;
      }
    }

    return checkedCount;
  }

  /**
   * Updates the progress display and status text to match the current
   * checkbox state.
   */
  private renderProgress(): void {

    const summary = calculateProgress(this.countCheckedItems(), TOTAL_ITEMS);

    this.progressText.textContent = summary.text;
    this.progressPercentage.textContent = summary.percentageText;
    this.progressBar.max = TOTAL_ITEMS;
    this.progressBar.value = summary.completedCount;
    this.progressMessage.textContent = summary.statusMessage;
  }

  /**
   * Saves the ids of every currently checked checkbox.
   */
  private persistCheckedState(): void {

    const checkedIds: string[] = [];

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        checkedIds.push(checkbox.id);
      }
    }

    this.completedItemsStore.save(checkedIds);
  }

  /**
   * Clears the persisted completed-item state, then unchecks all preparation
   * checkboxes.
   */
  private resetCheckedState(): void {

    this.completedItemsStore.clear();

    for (const checkbox of this.checkboxes) {

      checkbox.checked = false;
    }
  }

}

/**
 * Reports a startup failure to the console with a clear, prefixed message.
 * The page has no other feedback channel available if its own contract is
 * broken, so this is the last line of defence (see `AGENTS.md` section 2).
 *
 * @param error - The value caught at the top level; not guaranteed to be
 *   an `Error` instance.
 */
function reportStartupError(error: unknown): void {

  const message = error instanceof Error ? error.message : String(error);

  console.error(`Priprema za intervju: ${message}`);
}

/**
 * Entry point: builds the page controller and starts it. Runs once, when
 * this module executes.
 */
function main(): void {

  const page = new InterviewPreparationPage();

  page.start();
}

if (typeof document !== "undefined") {

  try {

    main();
  }
  catch (error) {

    reportStartupError(error);
  }
}
