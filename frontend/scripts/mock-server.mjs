#!/usr/bin/env node

/**
 * Lightweight mock backend server for OpenSourceMate.
 * Allows running and developing the frontend completely offline without
 * needing a running Python backend server or live GitHub API token.
 *
 * Usage:
 *   node scripts/mock-server.mjs
 *   PORT=8000 node scripts/mock-server.mjs
 */

import http from "node:http";
import { handleMockApiRequest } from "../mocks/handlers.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "127.0.0.1";

const server = http.createServer((req, res) => {
  // Set CORS headers for frontend communication
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-ID, X-RateLimit-Reset"
  );
  res.setHeader("Access-Control-Expose-Headers", "X-RateLimit-Reset");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "/";
  const method = req.method || "GET";

  const startTime = Date.now();
  const mockRes = handleMockApiRequest(url, method);

  if (mockRes) {
    for (const [key, value] of Object.entries(mockRes.headers)) {
      res.setHeader(key, value);
    }
    res.writeHead(mockRes.status);
    res.end(JSON.stringify(mockRes.body, null, 2));

    const duration = Date.now() - startTime;
    console.log(`[MOCK ${mockRes.status}] ${method} ${url} (${duration}ms)`);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          error: {
            code: "ROUTE_NOT_FOUND",
            message: `Mock route ${method} ${url} not found.`,
          },
        },
        null,
        2
      )
    );
    console.warn(`[MOCK 404] Unhandled route: ${method} ${url}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 OpenSourceMate Mock API Server running at:`);
  console.log(`   http://${HOST}:${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`Routes supported:`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/github/users/:username`);
  console.log(`   GET /api/github/users/:username/skills`);
  console.log(`   GET /api/github/users/:username/repositories`);
  console.log(`   GET /api/matching/users/:username/issues`);
  console.log(`======================================================\n`);
});
