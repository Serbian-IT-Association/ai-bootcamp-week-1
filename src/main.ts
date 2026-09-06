import { CompletedItemsStore } from "./storage.ts";

/** Total number of preparation checkboxes required by the HTML contract. */
const TOTAL_ITEMS = 8;

/**
 * Contains the calculated values needed to render preparation progress.
 */
interface ProgressResult {

  readonly completedCount: number;
  readonly totalCount: number;
  readonly percentage: number;
}

/**
 * Calculates preparation progress without reading or changing page state.
 *
 * @param completedCount - Number of completed preparation items.
 * @param totalCount - Total number of preparation items.
 * @returns The completed count, total count, and rounded percentage.
 */
export function calculateProgress(completedCount: number, totalCount: number): ProgressResult {

  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentage,
  };
}

/**
 * Holds the required elements used to render preparation progress.
 */
interface ProgressElements {

  readonly text: HTMLElement;
  readonly percentage: HTMLElement;
  readonly bar: HTMLProgressElement;
  readonly message: HTMLElement;
}

/**
 * Thrown when the page markup does not match the HTML contract this module
 * depends on, so a broken page fails with a clear message instead of silently
 * doing nothing.
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
 * `localStorage` through `storage.ts` and renders their current progress.
 */
class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly progressElements: ProgressElements;
  private readonly resetButton: HTMLButtonElement;
  private readonly completedItemsStore: CompletedItemsStore;

  /**
   * Reads and validates the eight preparation checkboxes. Throws
   * immediately when the HTML contract is broken, rather than failing
   * later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.progressElements = this.findProgressElements();
    this.resetButton = this.findResetButton();
    this.completedItemsStore = new CompletedItemsStore();
  }

  /**
   * Restores any previously saved checked state, then wires persistence so
   * further changes are saved. Call once, after construction.
   */
  public start(): void {

    const page = this;

    function onCheckboxChange(): void {

      page.persistCheckedState();
      page.updateProgressDisplay();
    }

    function onResetProgressClick(): void {

      page.completedItemsStore.clear();

      for (const checkbox of page.checkboxes) {

        checkbox.checked = false;
      }

      page.updateProgressDisplay();
    }

    this.restoreCheckedState();
    this.updateProgressDisplay();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetProgressClick);
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
   * Finds and validates every element required to render progress.
   *
   * @returns The required progress elements.
   */
  private findProgressElements(): ProgressElements {

    const text = document.getElementById("progress-text");
    const percentage = document.getElementById("progress-percentage");
    const bar = document.getElementById("progress-bar");
    const message = document.getElementById("progress-message");

    if (text === null) {

      throw new MissingElementError("'#progress-text'");
    }

    if (percentage === null) {

      throw new MissingElementError("'#progress-percentage'");
    }

    if (!(bar instanceof HTMLProgressElement)) {

      throw new MissingElementError("'#progress-bar' <progress> element");
    }

    if (message === null) {

      throw new MissingElementError("'#progress-message'");
    }

    return {
      text,
      percentage,
      bar,
      message,
    };
  }

  /**
   * Finds and validates the button that clears preparation progress.
   *
   * @returns The reset-progress button.
   */
  private findResetButton(): HTMLButtonElement {

    const resetButton = document.getElementById("reset-progress");

    if (!(resetButton instanceof HTMLButtonElement)) {

      throw new MissingElementError("'#reset-progress' <button> element");
    }

    return resetButton;
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
   * Calculates and renders progress from the current checkbox state.
   */
  private updateProgressDisplay(): void {

    let completedCount = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completedCount += 1;
      }
    }

    const progress = calculateProgress(completedCount, TOTAL_ITEMS);

    this.progressElements.text.textContent = `${progress.completedCount} od ${progress.totalCount} završeno`;
    this.progressElements.percentage.textContent = `${progress.percentage}%`;
    this.progressElements.bar.value = progress.completedCount;
    this.progressElements.message.textContent = this.getProgressMessage(progress);
  }

  /**
   * Selects the status message for the current progress state.
   *
   * @param progress - The calculated preparation progress.
   * @returns The message for no progress, partial progress, or completion.
   */
  private getProgressMessage(progress: ProgressResult): string {

    if (progress.completedCount === 0) {

      return "Počni pripremu";
    }

    if (progress.completedCount === progress.totalCount) {

      return "Priprema je završena";
    }

    return "Samo napred, priprema je u toku";
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
