/**
 * Owns the persistence contract for which checklist items are checked
 * (project-specification.md section 9): a single `localStorage` key
 * holding a JSON array of checked checkboxes' `id` strings.
 */
class CompletedItemsStore {

  private static readonly STORAGE_KEY = "priprema-za-intervju:completed-items";

  /**
   * Reads the persisted set of completed checkbox ids from `localStorage`.
   *
   * @returns The completed checkbox ids, or an empty array when none are
   *   stored or the stored value is invalid.
   */
  public load(): string[] {

    return this.parseCompletedItemIds(localStorage.getItem(CompletedItemsStore.STORAGE_KEY));
  }

  /**
   * Saves the given completed checkbox ids to `localStorage`, replacing
   * any previous value (persistence contract rule 2).
   *
   * @param ids - The ids of every currently checked checkbox.
   */
  public save(ids: readonly string[]): void {

    localStorage.setItem(CompletedItemsStore.STORAGE_KEY, JSON.stringify(ids));
  }

  /**
   * Removes the persisted completed-items state entirely, so the next
   * page load behaves like a first-ever visit (persistence contract
   * rule 3).
   */
  public clear(): void {

    localStorage.removeItem(CompletedItemsStore.STORAGE_KEY);
  }

  /**
   * Parses a raw `localStorage` value into the completed checkbox ids it
   * represents. Reads no external state, so it is easy to unit test
   * directly with plain strings.
   *
   * A missing value (`null`), or a value that is not a JSON array of
   * strings, is treated as "no items completed" rather than thrown, per
   * persistence contract rule 1: corrupted or absent stored data must
   * never block the page from loading.
   *
   * @param rawValue - The raw value as returned by `localStorage.getItem`,
   *   or `null` when the key is absent.
   * @returns The completed checkbox ids, or an empty array.
   */
  public parseCompletedItemIds(rawValue: string | null): string[] {

    if (rawValue === null) {

      return [];
    }

    try {

      const parsedValue: unknown = JSON.parse(rawValue);

      if (this.isStringArray(parsedValue)) {

        return parsedValue;
      }
    }
    catch (error) {

      // A corrupted stored value degrades to "no items completed" instead
      // of blocking the page from loading; nothing to report here.
    }

    return [];
  }

  /**
   * @param value - The value to check.
   * @returns Whether `value` is an array containing only strings.
   */
  private isStringArray(value: unknown): value is string[] {

    if (!Array.isArray(value)) {

      return false;
    }

    for (const element of value) {

      if (typeof element !== "string") {

        return false;
      }
    }

    return true;
  }
}

export { CompletedItemsStore };
