import { describe, expect, it } from "vitest";
import { VeltryxKernel, createBootstrapContext } from "../src/index.js";

async function readyKernel() { const kernel = new VeltryxKernel(); const context = createBootstrapContext(); await kernel.bootstrap(context); await kernel.initialize(context); await kernel.ready(context); return kernel; }

describe("Runtime API Bridge", () => {
  it("returns versioned safe envelopes", async () => {
    const bridge = (await readyKernel()).runtimeApi();
    const response = await bridge.status({ requestId: "test-1", correlationId: "corr-1" });
    expect(response.ok).toBe(true);
    expect(response.meta.apiVersion).toBe("v1");
    expect(response.meta.requestId).toBe("test-1");
    expect(Object.isFrozen(response)).toBe(true);
    expect(JSON.stringify(response)).not.toMatch(/stack|process\.env|connectionString|secret/i);
  });

  it("exposes only public views and validates pagination", async () => {
    const bridge = (await readyKernel()).runtimeApi();
    const configuration = await bridge.configuration();
    expect(configuration.ok && JSON.stringify(configuration)).not.toMatch(/token|password|DATABASE_URL/i);
    const components = await bridge.components({ limit: 100 });
    expect(components.ok).toBe(true);
    const invalid = await bridge.metadata({ limit: 101 });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.statusCode).toBe(400);
  });

  it("returns diagnostics and composition summaries", async () => {
    const bridge = (await readyKernel()).runtimeApi();
    expect((await bridge.health()).ok).toBe(true);
    expect((await bridge.diagnostics()).ok).toBe(true);
    expect((await bridge.runtimeStatus()).ok).toBe(true);
    expect((await bridge.uiComposition()).ok).toBe(true);
  });
});
