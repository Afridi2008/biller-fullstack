import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const app = express();

const PORT = 3000;
const FASTAPI_PORT = 8000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// ============================================================
// FASTAPI PROCESS
// ============================================================

let fastapiStarted = false;
let fastapiProcess: ChildProcess | null = null;

function ensureFastApi() {
  if (fastapiStarted) {
    return;
  }

  fastapiStarted = true;

  console.log('[BILLER] Starting FastAPI...');

  try {
    /*
     * Windows:
     *   python -m uvicorn ...
     *
     * Linux/macOS:
     *   python3 -m uvicorn ...
     *
     * This version detects the platform automatically.
     */

    const pythonCommand =
      process.platform === 'win32'
        ? 'python'
        : 'python3';

    fastapiProcess = spawn(
      pythonCommand,
      [
        '-m',
        'uvicorn',
        'backend.main:app',
        '--host',
        '127.0.0.1',
        '--port',
        String(FASTAPI_PORT),
      ],
      {
        cwd: process.cwd(),

        detached: false,

        /*
         * IMPORTANT:
         * Keep stdout/stderr visible while testing.
         */
        stdio: 'inherit',

        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
      }
    );

    fastapiProcess.on('error', (error) => {
      console.error(
        '[BILLER] FastAPI spawn error:',
        error.message
      );

      fastapiStarted = false;
      fastapiProcess = null;
    });

    fastapiProcess.on('exit', (code, signal) => {
      console.log(
        `[BILLER] FastAPI exited. code=${code}, signal=${signal}`
      );

      fastapiStarted = false;
      fastapiProcess = null;
    });

  } catch (error) {
    console.error(
      '[BILLER] FastAPI start error:',
      error
    );

    fastapiStarted = false;
    fastapiProcess = null;
  }
}

// Start FastAPI shortly after Node starts.
setTimeout(() => {
  ensureFastApi();
}, 500);


// ============================================================
// FASTAPI PROXY
// ============================================================

function forwardToFastAPI(
  req: express.Request,
  res: express.Response,
  fallbackHandler?: () => void
) {
  let completed = false;

  const runFallback = () => {
    if (
      completed ||
      res.headersSent ||
      res.writableEnded
    ) {
      return;
    }

    completed = true;

    if (fallbackHandler) {
      fallbackHandler();
    } else {
      res.status(503).json({
        success: false,
        error: 'FastAPI unavailable',
        fallback: true,
      });
    }
  };

  const options: http.RequestOptions = {
    hostname: '127.0.0.1',

    port: FASTAPI_PORT,

    path: req.originalUrl || req.url,

    method: req.method,

    headers: {
      ...req.headers,

      host: `127.0.0.1:${FASTAPI_PORT}`,
    },

    timeout: 5000,
  };

  const proxyReq = http.request(
    options,
    (proxyRes) => {
      if (
        completed ||
        res.headersSent ||
        res.writableEnded
      ) {
        proxyRes.resume();
        return;
      }

      completed = true;

      /*
       * Forward FastAPI response headers/status.
       */
      res.writeHead(
        proxyRes.statusCode || 200,
        proxyRes.headers
      );

      proxyRes.pipe(res);
    }
  );

  // ----------------------------------------------------------
  // Timeout
  // ----------------------------------------------------------

  proxyReq.on('timeout', () => {
    if (completed) {
      return;
    }

    console.log(
      '[BILLER] FastAPI request timed out.'
    );

    proxyReq.destroy();

    runFallback();
  });

  // ----------------------------------------------------------
  // Connection error
  // ----------------------------------------------------------

  proxyReq.on('error', (error) => {
    if (completed) {
      return;
    }

    console.log(
      `[BILLER] FastAPI proxy error: ${error.message}`
    );

    runFallback();
  });

  // ----------------------------------------------------------
  // Forward request body
  // ----------------------------------------------------------

  if (
    req.body &&
    ['POST', 'PUT', 'PATCH'].includes(
      req.method
    )
  ) {
    const bodyData =
      typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    proxyReq.setHeader(
      'Content-Length',
      Buffer.byteLength(bodyData)
    );

    proxyReq.setHeader(
      'Content-Type',
      'application/json'
    );

    proxyReq.write(bodyData);
  }

  proxyReq.end();
}


// ============================================================
// HEALTH
// ============================================================

app.get(
  '/api/health',
  (req, res) => {
    forwardToFastAPI(
      req,
      res,
      () => {
        res.json({
          status: 'ok',

          tech_stack: {
            frontend:
              'React JS + Vite',

            backend:
              'Python 3.10 + FastAPI',

            database:
              'MongoDB (PyMongo Driver)',

            validation:
              'Pydantic V2',
          },

          fastapi:
            'starting',

          timestamp:
            new Date().toISOString(),
        });
      }
    );
  }
);


// ============================================================
// ALL API ROUTES
// ============================================================

app.all(
  '/api/*',
  (req, res) => {
    forwardToFastAPI(
      req,
      res,
      () => {
        res.status(503).json({
          success: false,

          status:
            'fastapi_unavailable',

          message:
            'FastAPI is currently unavailable. Please wait a moment and try again.',

          timestamp:
            new Date().toISOString(),
        });
      }
    );
  }
);


// ============================================================
// FASTAPI DOCS
// ============================================================

app.get(
  '/docs',
  (req, res) => {
    forwardToFastAPI(
      req,
      res,
      () => {
        res.redirect('/api/health');
      }
    );
  }
);


// ============================================================
// OPENAPI
// ============================================================

app.get(
  '/openapi.json',
  (req, res) => {
    forwardToFastAPI(
      req,
      res,
      () => {
        res.json({
          openapi: '3.1.0',

          info: {
            title:
              'BILLER FastAPI Backend',

            version:
              '2.0.0',
          },
        });
      }
    );
  }
);


// ============================================================
// VITE / PRODUCTION STATIC FILES
// ============================================================

async function startServer() {

  if (
    process.env.NODE_ENV !==
    'production'
  ) {

    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },

        appType: 'spa',
      });

    app.use(
      vite.middlewares
    );

  } else {

    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {

      console.log(
        `[BILLER] Server running on http://localhost:${PORT}`
      );

      console.log(
        `[BILLER] FastAPI expected at http://127.0.0.1:${FASTAPI_PORT}`
      );
    }
  );
}


// ============================================================
// SHUTDOWN
// ============================================================

function shutdown() {

  console.log(
    '[BILLER] Shutting down...'
  );

  if (fastapiProcess) {

    try {
      fastapiProcess.kill();
    } catch {
      // Ignore shutdown errors.
    }

    fastapiProcess = null;
  }

  process.exit(0);
}

process.on(
  'SIGINT',
  shutdown
);

process.on(
  'SIGTERM',
  shutdown
);


// ============================================================
// START
// ============================================================

startServer();