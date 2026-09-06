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
 * project-specification.md section 9, and drives the progress display
 * (count, percentage, bar, message) and the reset button from that same
 * checked state.
 */
class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly completedItemsStore: CompletedItemsStore;
  private readonly progressTextElement: HTMLElement;
  private readonly progressPercentageElement: HTMLElement;
  private readonly progressBarElement: HTMLProgressElement;
  private readonly progressMessageElement: HTMLElement;
  private readonly resetButton: HTMLButtonElement;

  /**
   * Reads and validates the eight preparation checkboxes and every
   * progress-panel element. Throws immediately when the HTML contract is
   * broken, rather than failing later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.completedItemsStore = new CompletedItemsStore();
    this.progressTextElement = this.findElementById("progress-text");
    this.progressPercentageElement = this.findElementById("progress-percentage");
    this.progressBarElement = this.findProgressBarElement();
    this.progressMessageElement = this.findElementById("progress-message");
    this.resetButton = this.findResetButton();
  }

  /**
   * Restores any previously saved checked state, renders the initial
   * progress display, then wires persistence and the reset button so
   * further changes are saved and reflected. Call once, after
   * construction.
   */
  public start(): void {

    const page = this;

    function onCheckboxChange(): void {

      page.updateProgressDisplay();

      try {

        page.persistCheckedState();
      }
      catch (error) {

        console.error("InterviewPreparationPage.onCheckboxChange: čuvanje stanja nije uspelo", error);
      }
    }

    function onResetClick(): void {

      page.resetProgress();
    }

    this.restoreCheckedState();
    this.updateProgressDisplay();

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
   * Unchecks every checkbox, clears the persisted state entirely, and
   * re-renders the progress display, so the page behaves like a
   * first-ever visit.
   */
  private resetProgress(): void {

    for (const checkbox of this.checkboxes) {

      checkbox.checked = false;
    }

    this.completedItemsStore.clear();
    this.updateProgressDisplay();
  }

  /**
   * Recomputes progress from the checkboxes' current checked state and
   * writes the result into the progress-count text, the percentage, the
   * progress bar, and the status message.
   */
  private updateProgressDisplay(): void {

    const progress = calculateProgress(this.countCheckedCheckboxes(), TOTAL_ITEMS);

    this.progressTextElement.textContent = `${progress.completedCount} od ${progress.totalCount} završeno`;
    this.progressPercentageElement.textContent = `${progress.percentage}%`;
    this.progressBarElement.value = progress.completedCount;
    this.progressMessageElement.textContent = progress.message;
  }

  /**
   * @returns How many of the eight checkboxes are currently checked.
   */
  private countCheckedCheckboxes(): number {

    let checkedCount = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        checkedCount += 1;
      }
    }

    return checkedCount;
  }

  /**
   * Finds and validates a single required element by id.
   *
   * @param elementId - The `id` attribute of the required element.
   * @returns The matching element.
   */
  private findElementById(elementId: string): HTMLElement {

    const element = document.getElementById(elementId);

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError(`element with id "${elementId}"`);
    }

    return element;
  }

  /**
   * Finds and validates the `<progress>` element used for the progress
   * bar, which needs its `value` property set and so must be a
   * `HTMLProgressElement`, not just a plain `HTMLElement`.
   *
   * @returns The progress bar element.
   */
  private findProgressBarElement(): HTMLProgressElement {

    const element = document.getElementById("progress-bar");

    if (!(element instanceof HTMLProgressElement)) {

      throw new MissingElementError('progress bar element with id "progress-bar"');
    }

    return element;
  }

  /**
   * Finds and validates the reset button, which needs a `click` listener
   * and so must be a `HTMLButtonElement`, not just a plain `HTMLElement`.
   *
   * @returns The reset button element.
   */
  private findResetButton(): HTMLButtonElement {

    const element = document.getElementById("reset-progress");

    if (!(element instanceof HTMLButtonElement)) {

      throw new MissingElementError('reset button with id "reset-progress"');
    }

    return element;
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
