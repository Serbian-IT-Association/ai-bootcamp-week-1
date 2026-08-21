import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join, normalize, sep } from "node:path";

const SERVER_HOST = "localhost";
const SERVER_PORT = 4173;

/**
 * Maps a file extension to the Content-Type header value that should be
 * sent for it. Unlisted extensions fall back to a generic binary type.
 */
const CONTENT_TYPES_BY_EXTENSION = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/**
 * Thrown when a request path would resolve outside the distribution root
 * directory. Kept as its own type so the request handler can distinguish
 * "forbidden" from "not found" without parsing an error message.
 */
class PathTraversalError extends Error {

  /**
   * @param {string} requestUrl - The raw, unresolved URL that was requested.
   */
  constructor(requestUrl) {

    super(`Requested path escapes the distribution root: ${requestUrl}`);
    this.name = "PathTraversalError";
  }
}

/**
 * A minimal static file server that serves exactly one directory (the
 * generated `dist/`) and refuses every request that would resolve outside
 * it. It never falls back to serving files from the wider repository.
 */
class DistributionServer {

  /**
   * @param {string} distDirectoryPath - Absolute path to the directory to serve.
   * @param {string} host - Hostname to bind to.
   * @param {number} port - TCP port to listen on.
   */
  constructor(distDirectoryPath, host, port) {

    this.distDirectoryPath = distDirectoryPath;
    this.host = host;
    this.port = port;
    this.httpServer = createServer(this.handleRequest.bind(this));
  }

  /**
   * Verifies that `dist/` exists, then starts listening. Throws a
   * descriptive error when the distribution is missing, the port is
   * already in use, or the server otherwise fails to bind.
   *
   * @returns {Promise<void>}
   */
  async start() {

    await this.assertDistDirectoryExists();

    const server = this;

    return new Promise(function startListening(resolve, reject) {

      function onError(error) {

        server.httpServer.removeListener("listening", onListening);

        if (error.code === "EADDRINUSE") {

          reject(new Error(`Port ${server.port} is already in use. Stop the other process and try again.`));
        }
        else {

          reject(new Error(`Failed to start the server: ${error.message}`));
        }
      }

      function onListening() {

        server.httpServer.removeListener("error", onError);
        resolve();
      }

      server.httpServer.once("error", onError);
      server.httpServer.once("listening", onListening);
      server.httpServer.listen(server.port, server.host);
    });
  }

  /**
   * Stops accepting new connections and closes the underlying socket.
   *
   * @returns {Promise<void>}
   */
  async stop() {

    const server = this;

    return new Promise(function stopListening(resolve, reject) {

      function onClosed(error) {

        if (error) {

          reject(error);
          return;
        }

        resolve();
      }

      server.httpServer.close(onClosed);
    });
  }

  /**
   * Handles a single HTTP request: resolves it to a file under `dist/` and
   * streams that file back, or responds with 403/404 as appropriate.
   *
   * @param {import("node:http").IncomingMessage} request
   * @param {import("node:http").ServerResponse} response
   * @returns {Promise<void>}
   */
  async handleRequest(request, response) {

    let resolvedPath;

    try {

      resolvedPath = this.resolveRequestedPath(request.url ?? "/");
    }
    catch (error) {

      if (error instanceof PathTraversalError) {

        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      throw error;
    }

    try {

      const fileContents = await readFile(resolvedPath);
      const fileExtension = extname(resolvedPath);
      const contentType = CONTENT_TYPES_BY_EXTENSION[fileExtension] ?? "application/octet-stream";

      response.writeHead(200, { "Content-Type": contentType });
      response.end(fileContents);
    }
    catch {

      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }

  /**
   * Resolves a request URL against the distribution root and rejects any
   * result that would escape it (path traversal).
   *
   * @param {string} requestUrl - The raw `request.url` value.
   * @returns {string} An absolute filesystem path inside distDirectoryPath.
   */
  resolveRequestedPath(requestUrl) {

    const requestPathOnly = requestUrl.split("?")[0] ?? "/";
    const decodedPath = decodeURIComponent(requestPathOnly);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
    const resolvedPath = normalize(join(this.distDirectoryPath, relativePath));
    const isRootItself = resolvedPath === this.distDirectoryPath;
    const isInsideRoot = resolvedPath.startsWith(this.distDirectoryPath + sep);

    if (!isRootItself && !isInsideRoot) {

      throw new PathTraversalError(requestUrl);
    }

    return resolvedPath;
  }

  /**
   * @returns {Promise<void>}
   */
  async assertDistDirectoryExists() {

    try {

      await stat(this.distDirectoryPath);
    }
    catch {

      throw new Error(`'${this.distDirectoryPath}' does not exist. Run 'npm run build' before 'npm start'.`);
    }
  }
}

/**
 * Entry point for the `npm start` server step.
 *
 * @returns {Promise<void>}
 */
async function main() {

  const distDirectoryPath = fileURLToPath(new URL("../dist", import.meta.url));
  const server = new DistributionServer(distDirectoryPath, SERVER_HOST, SERVER_PORT);

  await server.start();

  console.log(`http://${SERVER_HOST}:${SERVER_PORT}`);
}

try {

  await main();
}
catch (error) {

  console.error(`serve: ${error.message}`);
  process.exit(1);
}
