import { CompletedItemsStore } from "./storage.ts";

/** Total number of preparation checkboxes required by the HTML contract. */
const TOTAL_ITEMS = 8;

/**
 * The derived values displayed by the progress panel for the current
 * completed-checkbox count.
 */
interface ProgressDetails {

  readonly completedItems: number;
  readonly percentage: number;
  readonly message: string;
}

/**
 * Derives the display values for the preparation progress panel.
 *
 * @param completedItems - Number of currently checked preparation items.
 * @returns The completed count, rounded percentage, and matching status
 * message.
 */
export function calculateProgress(completedItems: number): ProgressDetails {

  const percentage = Math.round((completedItems / TOTAL_ITEMS) * 100);
  let message = "Nastavi pripremu";

  if (completedItems === 0) {

    message = "Počni pripremu";
  }
  else if (completedItems === TOTAL_ITEMS - 1) {

    message = "Još samo jedan korak!";
  }
  else if (completedItems === TOTAL_ITEMS) {

    message = "Spreman/na si za intervju!";
  }

  return {
    completedItems,
    percentage,
    message
  };
}

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
    this.progressText = this.findHtmlElement("progress-text");
    this.progressPercentage = this.findHtmlElement("progress-percentage");
    this.progressBar = this.findProgressBar();
    this.progressMessage = this.findHtmlElement("progress-message");
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

    function onResetClick(): void {

      page.resetProgress();
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
   * Finds a required HTML element by its id.
   *
   * @param elementId - The id required by the page markup contract.
   * @returns The matching HTML element.
   */
  private findHtmlElement(elementId: string): HTMLElement {

    const element = document.getElementById(elementId);

    if (!(element instanceof HTMLElement)) {

      throw new MissingElementError(`#${elementId}`);
    }

    return element;
  }

  /**
   * Finds the native progress element required by the progress panel.
   *
   * @returns The page's progress bar.
   */
  private findProgressBar(): HTMLProgressElement {

    const element = document.getElementById("progress-bar");

    if (!(element instanceof HTMLProgressElement)) {

      throw new MissingElementError("#progress-bar progress element");
    }

    return element;
  }

  /**
   * Finds the button that returns the checklist to its initial state.
   *
   * @returns The page's reset button.
   */
  private findResetButton(): HTMLButtonElement {

    const element = document.getElementById("reset-progress");

    if (!(element instanceof HTMLButtonElement)) {

      throw new MissingElementError("#reset-progress button");
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
   * Counts the checklist items that are currently checked.
   *
   * @returns The number of completed preparation items.
   */
  private countCompletedItems(): number {

    let completedItems = 0;

    for (const checkbox of this.checkboxes) {

      if (checkbox.checked) {

        completedItems += 1;
      }
    }

    return completedItems;
  }

  /**
   * Renders every existing progress-panel value from the current checkbox
   * state, keeping the visual state derived rather than separately stored.
   */
  private renderProgress(): void {

    const completedItems = this.countCompletedItems();
    const progress = calculateProgress(completedItems);

    this.progressText.textContent = `${progress.completedItems} od ${TOTAL_ITEMS} završeno`;
    this.progressPercentage.textContent = `${progress.percentage}%`;
    this.progressBar.value = progress.completedItems;
    this.progressMessage.textContent = progress.message;
  }

  /**
   * Clears every checked item, removes persisted state, and redraws the
   * progress panel at its initial state.
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

/**
 * Starts the page in a browser and reports any startup-contract failure.
 */
function startPage(): void {

  try {

    main();
  }
  catch (error) {

    reportStartupError(error);
  }
}

if (typeof document !== "undefined") {

  startPage();
}
