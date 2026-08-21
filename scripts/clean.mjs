import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Removes the generated distribution directory so that every build starts
 * from a known, empty state.
 */
class DistCleaner {

  /**
   * @param {string} distDirectoryPath - Absolute path to the dist/ directory.
   */
  constructor(distDirectoryPath) {

    this.distDirectoryPath = distDirectoryPath;
  }

  /**
   * Deletes the distribution directory. Does nothing when it is already
   * absent; throws a descriptive error for any other failure (for example,
   * a permission problem).
   *
   * @returns {Promise<void>}
   */
  async clean() {

    try {

      await rm(this.distDirectoryPath, { recursive: true, force: true });
    }
    catch (error) {

      throw new Error(`DistCleaner: failed to remove '${this.distDirectoryPath}': ${error.message}`);
    }
  }
}

/**
 * Entry point for the `npm run clean` script.
 *
 * @returns {Promise<void>}
 */
async function main() {

  const distDirectoryPath = fileURLToPath(new URL("../dist", import.meta.url));
  const cleaner = new DistCleaner(distDirectoryPath);

  await cleaner.clean();
}

try {

  await main();
}
catch (error) {

  console.error(`clean: ${error.message}`);
  process.exit(1);
}
