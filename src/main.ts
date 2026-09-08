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
 * project-specification.md section 9. Connecting the progress display and
 * the reset button to this state is this project's task; see
 * `README-sr.md`.
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
    this.completedItemsStore = new CompletedItemsStore();
    this.progressText = this.findElement("progress-text");
    this.progressPercentage = this.findElement("progress-percentage");
    this.progressBar = this.findProgressBar();
    this.progressMessage = this.findElement("progress-message");
    this.resetButton = this.findResetButton();
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

    function onResetButtonClick(): void {

      page.resetProgress();
    }

    this.restoreCheckedState();
    this.renderProgress();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }

    this.resetButton.addEventListener("click", onResetButtonClick);
  }

  /**
   * Finds a required element by id.
   *
   * @param id - The required element id from the HTML contract.
   * @returns The matching element.
   */
  private findElement(id: string): HTMLElement {

    const element = document.getElementById(id);

    if (element === null) {

      throw new MissingElementError(`#${id}`);
    }

    return element;
  }

  /**
   * Finds and validates the progress element.
   *
   * @returns The progress element used for the visual indicator.
   */
  private findProgressBar(): HTMLProgressElement {

    const element = document.getElementById("progress-bar");

    if (!(element instanceof HTMLProgressElement)) {

      throw new MissingElementError("progress element #progress-bar");
    }

    return element;
  }

  /**
   * Finds and validates the reset button.
   *
   * @returns The button that restores the initial state.
   */
  private findResetButton(): HTMLButtonElement {

    const element = document.getElementById("reset-progress");

    if (!(element instanceof HTMLButtonElement)) {

      throw new MissingElementError("button #reset-progress");
    }

    return element;
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
   * Updates every progress element from the current checkbox state.
   */
  private renderProgress(): void {

    let completedItems = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completedItems += 1;
      }
    }

    const progress = calculateProgress(completedItems, TOTAL_ITEMS);

    this.progressText.textContent = `${progress.completed} od ${progress.total} završeno`;
    this.progressPercentage.textContent = `${progress.percentage}%`;
    this.progressBar.value = progress.completed;
    this.progressBar.textContent = `${progress.percentage}%`;
    this.progressMessage.textContent = progress.message;
  }

  /**
   * Clears all completed items from the page and persistent storage.
   */
  private resetProgress(): void {

    for (const checkbox of this.checkboxes) {

      checkbox.checked = false;
    }

    this.completedItemsStore.clear();
    this.renderProgress();
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
