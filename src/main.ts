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
 * project-specification.md section 9, and updates the progress display
 * from the current checked state.
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
   * Reads and validates the eight preparation checkboxes. Throws
   * immediately when the HTML contract is broken, rather than failing
   * later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.progressText = this.findTextElement("#progress-text");
    this.progressPercentage = this.findTextElement("#progress-percentage");
    this.progressMessage = this.findTextElement("#progress-message");

    const progressBar = document.querySelector("#progress-bar");

    if (!(progressBar instanceof HTMLProgressElement)) {

      throw new MissingElementError("#progress-bar (HTMLProgressElement)");
    }

    this.progressBar = progressBar;
    const resetButton = document.querySelector("#reset-progress");

    if (!(resetButton instanceof HTMLButtonElement)) {

      throw new MissingElementError("#reset-progress (HTMLButtonElement)");
    }

    this.resetButton = resetButton;
    this.completedItemsStore = new CompletedItemsStore();
  }

  /**
   * Restores checked state and progress, then wires display updates and
   * persistence. Call once, after construction.
   */
  public start(): void {

    const page = this;

    /** Keeps visible progress current even if saving fails. */
    function onCheckboxChange(): void {

      page.updateProgress();

      try {

        page.persistCheckedState();
      }
      catch (error) {

        console.error("InterviewPreparationPage.onCheckboxChange: čuvanje stanja nije uspelo", error);
      }
    }

    /** Resets the page through the same controller that handles changes. */
    function onResetClick(): void {

      page.resetProgress();
    }

    this.restoreCheckedState();
    this.updateProgress();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetClick);
  }

  /** Resets visible progress even when the browser refuses storage access. */
  private resetProgress(): void {

    for (const checkbox of this.checkboxes) {

      checkbox.checked = false;
    }

    this.updateProgress();

    try {

      this.completedItemsStore.clear();
    }
    catch (error) {

      console.error("InterviewPreparationPage.resetProgress: brisanje stanja nije uspelo", error);
    }
  }

  /** Finds a required text element without an unchecked type conversion. */
  private findTextElement(selector: string): HTMLElement {

    const element = document.querySelector(selector);

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError(selector);
    }

    return element;
  }

  /** Derives all progress displays from the currently checked fields. */
  private updateProgress(): void {

    let completed = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completed += 1;
      }
    }

    const progress = calculateProgress(completed, this.checkboxes.length);
    const percentageText = `${String(progress.percentage).replace(".", ",")}%`;
    let message = "Priprema je u toku";

    if (progress.completed === 0) {

      message = "Počni pripremu";
    }
    else if (progress.completed === progress.total) {

      message = "Priprema je završena";
    }

    this.progressText.textContent = `${progress.completed} od ${progress.total} završeno`;
    this.progressPercentage.textContent = percentageText;
    this.progressBar.max = progress.total;
    this.progressBar.value = progress.completed;
    this.progressBar.textContent = percentageText;
    this.progressMessage.textContent = message;
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
