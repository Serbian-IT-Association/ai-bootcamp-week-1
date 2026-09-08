import { CompletedItemsStore } from "./storage.ts";
import { calculateProgress } from "./progress.ts";

/** Total number of preparation checkboxes required by the HTML contract. */
const TOTAL_ITEMS = 8;

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
 * project-specification.md section 9. Updates progress after restoring,
 * changing, or resetting the checked state.
 */
class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly completedItemsStore: CompletedItemsStore;
  private readonly progressText: HTMLElement;
  private readonly progressPercentage: HTMLElement;
  private readonly progressBar: HTMLProgressElement;
  private readonly progressMessage: HTMLElement;
  private readonly resetButton: HTMLButtonElement;

  /**
   * Reads and validates the checkboxes, progress display, and reset button. Throws
   * immediately when the HTML contract is broken, rather than failing
   * later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.completedItemsStore = new CompletedItemsStore();
    this.progressText = this.findRequiredElement("#progress-text");
    this.progressPercentage = this.findRequiredElement("#progress-percentage");
    this.progressMessage = this.findRequiredElement("#progress-message");

    const progressBar = this.findRequiredElement("#progress-bar");
    const resetButton = this.findRequiredElement("#reset-progress");

    if (!(progressBar instanceof HTMLProgressElement)) {

      throw new MissingElementError("progress element '#progress-bar'");
    }

    if (!(resetButton instanceof HTMLButtonElement)) {

      throw new MissingElementError("button element '#reset-progress'");
    }

    this.progressBar = progressBar;
    this.resetButton = resetButton;
  }

  /**
   * Restores saved state and progress, then connects changes and reset.
   * Call once, after construction.
   */
  public start(): void {

    const page = this;

    function onCheckboxChange(): void {

      page.persistCheckedState();
      page.updateProgress();
    }

    function onResetProgress(): void {

      for (const checkbox of page.checkboxes) {

        checkbox.checked = false;
      }

      try {

        page.completedItemsStore.clear();
      }
      catch (error) {

        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`InterviewPreparationPage: could not clear saved progress: ${message}`);
      }

      page.updateProgress();
    }

    this.restoreCheckedState();
    this.updateProgress();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetProgress);
  }

  /** Finds a required HTML element or reports the broken selector contract. */
  private findRequiredElement(selector: string): HTMLElement {

    const element = document.querySelector(selector);

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError(selector);
    }

    return element;
  }

  /** Renders progress from the current checkbox state, including restored state. */
  private updateProgress(): void {

    let completed = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completed += 1;
      }
    }

    const progress = calculateProgress(completed, TOTAL_ITEMS);
    const percentageText = `${progress.percentage}%`;

    this.progressText.textContent = `${progress.completed} od ${TOTAL_ITEMS} završeno`;
    this.progressPercentage.textContent = percentageText;
    this.progressBar.value = progress.completed;
    this.progressBar.textContent = percentageText;
    this.progressMessage.textContent = progress.message;
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

try {

  main();
}
catch (error) {

  reportStartupError(error);
}
