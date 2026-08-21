import { copyFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Copies the static assets that the compiler does not produce (HTML and
 * CSS) from `public/` into `dist/`, failing loudly when a required source
 * file is missing instead of silently producing an incomplete build.
 */
class StaticAssetCopier {

  /**
   * @param {string} sourceDirectoryPath - Absolute path to public/.
   * @param {string} destinationDirectoryPath - Absolute path to dist/.
   * @param {string[]} fileNames - Static file names to copy, relative to sourceDirectoryPath.
   */
  constructor(sourceDirectoryPath, destinationDirectoryPath, fileNames) {

    this.sourceDirectoryPath = sourceDirectoryPath;
    this.destinationDirectoryPath = destinationDirectoryPath;
    this.fileNames = fileNames;
  }

  /**
   * Copies every configured file, creating destination directories as
   * needed.
   *
   * @returns {Promise<void>}
   */
  async copyAll() {

    await mkdir(this.destinationDirectoryPath, { recursive: true });

    for (const fileName of this.fileNames) {

      await this.copyOne(fileName);
    }
  }

  /**
   * Copies a single static file after confirming the source exists, so a
   * missing asset produces a clear error naming the file, not a raw
   * filesystem exception.
   *
   * @param {string} fileName
   * @returns {Promise<void>}
   */
  async copyOne(fileName) {

    const sourcePath = join(this.sourceDirectoryPath, fileName);
    const destinationPath = join(this.destinationDirectoryPath, fileName);

    await this.assertFileExists(sourcePath);
    await mkdir(dirname(destinationPath), { recursive: true });

    try {

      await copyFile(sourcePath, destinationPath);
    }
    catch (error) {

      throw new Error(`StaticAssetCopier: failed to copy '${sourcePath}' to '${destinationPath}': ${error.message}`);
    }
  }

  /**
   * @param {string} filePath
   * @returns {Promise<void>}
   */
  async assertFileExists(filePath) {

    try {

      await access(filePath);
    }
    catch {

      throw new Error(`StaticAssetCopier: required static asset is missing: ${filePath}`);
    }
  }
}

/**
 * Entry point for the `copy-static` build step.
 *
 * @returns {Promise<void>}
 */
async function main() {

  const publicDirectoryPath = fileURLToPath(new URL("../public", import.meta.url));
  const distDirectoryPath = fileURLToPath(new URL("../dist", import.meta.url));
  const staticFileNames = ["index.html", "styles.css"];
  const copier = new StaticAssetCopier(publicDirectoryPath, distDirectoryPath, staticFileNames);

  await copier.copyAll();
}

try {

  await main();
}
catch (error) {

  console.error(`copy-static: ${error.message}`);
  process.exit(1);
}
