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
 * project-specification.md section 9, renders progress from their current
 * checked state, and resets both visible and persisted progress.
 */
class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly completedItemsStore: CompletedItemsStore;
  private readonly progressTextElement: HTMLSpanElement;
  private readonly progressPercentageElement: HTMLSpanElement;
  private readonly progressBarElement: HTMLProgressElement;
  private readonly progressMessageElement: HTMLParagraphElement;
  private readonly resetButton: HTMLButtonElement;

  /**
   * Reads and validates the interactive elements required by the page.
   * Throws immediately when the HTML contract is broken, rather than
   * failing later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
    this.completedItemsStore = new CompletedItemsStore();
    this.progressTextElement = this.findProgressTextElement();
    this.progressPercentageElement = this.findProgressPercentageElement();
    this.progressBarElement = this.findProgressBarElement();
    this.progressMessageElement = this.findProgressMessageElement();
    this.resetButton = this.findResetButton();
  }

  /**
   * Restores saved checkbox state, renders it, and wires checkbox and reset
   * interactions to their corresponding behavior. Call once, after
   * construction.
   */
  public start(): void {

    const page = this;

    function onCheckboxChange(): void {

      page.persistCheckedState();
      page.updateProgressDisplay();
    }

    function onResetButtonClick(): void {

      page.resetProgress();
    }

    this.restoreCheckedState();
    this.updateProgressDisplay();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetButtonClick);
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
   * Finds the element that displays the number of completed items.
   *
   * @returns The validated progress-text span.
   */
  private findProgressTextElement(): HTMLSpanElement {

    const element = document.getElementById("progress-text");

    if (!(element instanceof HTMLSpanElement)) {

      throw new MissingElementError("a span with id 'progress-text'");
    }

    return element;
  }

  /**
   * Finds the element that displays the completed percentage.
   *
   * @returns The validated progress-percentage span.
   */
  private findProgressPercentageElement(): HTMLSpanElement {

    const element = document.getElementById("progress-percentage");

    if (!(element instanceof HTMLSpanElement)) {

      throw new MissingElementError("a span with id 'progress-percentage'");
    }

    return element;
  }

  /**
   * Finds the native element that displays progress visually.
   *
   * @returns The validated progress element.
   */
  private findProgressBarElement(): HTMLProgressElement {

    const element = document.getElementById("progress-bar");

    if (!(element instanceof HTMLProgressElement)) {

      throw new MissingElementError("a progress element with id 'progress-bar'");
    }

    return element;
  }

  /**
   * Finds the live region that displays the current progress message.
   *
   * @returns The validated progress-message paragraph.
   */
  private findProgressMessageElement(): HTMLParagraphElement {

    const element = document.getElementById("progress-message");

    if (!(element instanceof HTMLParagraphElement)) {

      throw new MissingElementError("a paragraph with id 'progress-message'");
    }

    return element;
  }

  /**
   * Finds the button used to clear all progress.
   *
   * @returns The validated reset-progress button.
   */
  private findResetButton(): HTMLButtonElement {

    const element = document.getElementById("reset-progress");

    if (!(element instanceof HTMLButtonElement)) {

      throw new MissingElementError("a button with id 'reset-progress'");
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
   * Counts the preparation checkboxes that are currently checked.
   *
   * @returns The current number of completed preparation items.
   */
  private countCompletedItems(): number {

    let completedCount = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completedCount += 1;
      }
    }

    return completedCount;
  }

  /**
   * Renders every progress value from the current checkbox state.
   */
  private updateProgressDisplay(): void {

    const completedCount = this.countCompletedItems();
    const progress = calculateProgress(completedCount, TOTAL_ITEMS);

    this.progressTextElement.textContent = `${progress.completedCount} od ${progress.totalCount} završeno`;
    this.progressPercentageElement.textContent = `${progress.percentage}%`;
    this.progressBarElement.value = progress.completedCount;
    this.progressMessageElement.textContent = progress.message;
  }

  /**
   * Clears persisted progress, unchecks every item, and renders the initial
   * progress state.
   */
  private resetProgress(): void {

    this.completedItemsStore.clear();

    for (const checkbox of this.checkboxes) {

      checkbox.checked = false;
    }

    this.updateProgressDisplay();
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
