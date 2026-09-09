import { CompletedItemsStore } from "./storage.ts";
import { calculateProgress } from "./progress.ts";

/** Total number of preparation checkboxes required by the HTML contract. */
const TOTAL_ITEMS = 8;

class MissingElementError extends Error {

  constructor(elementDescription: string) {
    super(`InterviewPreparationPage: required element not found: ${elementDescription}`);
    this.name = "MissingElementError";
  }
}

class InterviewPreparationPage {

  private readonly checkboxes: HTMLInputElement[];
  private readonly completedItemsStore: CompletedItemsStore;

  private readonly progressText: HTMLElement;
  private readonly progressPercentage: HTMLElement;
  private readonly progressBar: HTMLProgressElement;
  private readonly progressMessage: HTMLElement;
  private readonly resetButton: HTMLButtonElement;

  constructor() {
    this.checkboxes = this.findCheckboxes();
    this.completedItemsStore = new CompletedItemsStore();

    this.progressText = this.findRequiredElement("progress-text");
    this.progressPercentage = this.findRequiredElement("progress-percentage");
    this.progressMessage = this.findRequiredElement("progress-message");

    const progressBar = document.getElementById("progress-bar");

    if (!(progressBar instanceof HTMLProgressElement)) {
      throw new MissingElementError("'progress-bar' progress element");
    }

    this.progressBar = progressBar;

    const resetButton = document.getElementById("reset-progress");

    if (!(resetButton instanceof HTMLButtonElement)) {
      throw new MissingElementError("'reset-progress' button");
    }

    this.resetButton = resetButton;
  }

  public start(): void {
    this.restoreCheckedState();
    this.renderProgress();

    for (const checkbox of this.checkboxes) {
      checkbox.addEventListener("change", () => {
        this.persistCheckedState();
        this.renderProgress();
      });
    }

    this.resetButton.addEventListener("click", () => {
      this.resetProgress();
    });
  }

  private findRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (element === null) {
      throw new MissingElementError(`#${id}`);
    }

    return element;
  }

  private findCheckboxes(): HTMLInputElement[] {
    const candidateElements = document.querySelectorAll("[data-prep-item]");
    const checkboxes: HTMLInputElement[] = [];

    for (const candidateElement of candidateElements) {
      if (
        candidateElement instanceof HTMLInputElement
        && candidateElement.type === "checkbox"
      ) {
        checkboxes.push(candidateElement);
      }
    }

    if (checkboxes.length !== TOTAL_ITEMS) {
      throw new MissingElementError(
        `exactly ${TOTAL_ITEMS} '[data-prep-item]' checkboxes (found ${checkboxes.length})`,
      );
    }

    return checkboxes;
  }

  private restoreCheckedState(): void {
    const persistedIds = this.completedItemsStore.load();

    for (const checkbox of this.checkboxes) {
      checkbox.checked = persistedIds.includes(checkbox.id);
    }
  }

  private persistCheckedState(): void {
    const checkedIds: string[] = [];

    for (const checkbox of this.checkboxes) {
      if (checkbox.checked) {
        checkedIds.push(checkbox.id);
      }
    }

    this.completedItemsStore.save(checkedIds);
  }

  private renderProgress(): void {
    let completed = 0;

    for (const checkbox of this.checkboxes) {
      if (checkbox.checked) {
        completed++;
      }
    }

    const progress = calculateProgress(completed, TOTAL_ITEMS);

    this.progressText.textContent =
      `${progress.completed} od ${TOTAL_ITEMS} završeno`;

    this.progressPercentage.textContent =
      `${progress.percentage}%`;

    this.progressBar.value = progress.completed;
    this.progressBar.textContent = `${progress.percentage}%`;

    this.progressMessage.textContent = progress.message;
  }

  private resetProgress(): void {
    for (const checkbox of this.checkboxes) {
      checkbox.checked = false;
    }

    this.completedItemsStore.clear();
    this.renderProgress();
  }
}

function reportStartupError(error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(`Priprema za intervju: ${message}`);
}

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