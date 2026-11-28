import "@testing-library/jest-dom";

// Polyfill web streams & fetch primitives for next/og or edge-runtime modules in jsdom
if (typeof global.ReadableStream === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReadableStream, WritableStream, TransformStream } = require("node:stream/web");
  // @ts-ignore
  global.ReadableStream = ReadableStream;
  // @ts-ignore
  global.WritableStream = WritableStream;
  // @ts-ignore
  global.TransformStream = TransformStream;
}

if (typeof global.Headers === "undefined") {
  // @ts-ignore
  global.Headers = class Headers {
    map: Map<string, string>;
    constructor(init?: any) {
      this.map = new Map();
      if (init) {
        if (typeof init.entries === "function" || Array.isArray(init)) {
          for (const [k, v] of init) {
            this.map.set(String(k).toLowerCase(), String(v));
          }
        } else if (typeof init === "object") {
          for (const [k, v] of Object.entries(init)) {
            this.map.set(String(k).toLowerCase(), String(v));
          }
        }
      }
    }
    get(name: string) {
      return this.map.get(name.toLowerCase()) || null;
    }
    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value);
    }
    has(name: string) {
      return this.map.has(name.toLowerCase());
    }
  };
}

if (typeof global.Response === "undefined") {
  // @ts-ignore
  global.Response = class Response {
    body: any;
    status: number;
    headers: any;
    constructor(body?: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new (global.Headers || Map)(init?.headers);
    }
  };
}
if (typeof global.Request === "undefined") {
  // @ts-ignore
  global.Request = class Request {};
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
