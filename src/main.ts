import { CompletedItemsStore } from "./storage.ts";

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

  /**
   * Reads and validates the eight preparation checkboxes. Throws
   * immediately when the HTML contract is broken, rather than failing
   * later.
   */
  constructor() {

    this.checkboxes = this.findCheckboxes();
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
    }

    this.restoreCheckedState();

    for (const checkbox of this.checkboxes) {

      checkbox.addEventListener("change", onCheckboxChange);
    }
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
