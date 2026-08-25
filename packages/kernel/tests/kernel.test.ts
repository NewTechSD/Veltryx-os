import { describe, expect, it } from "vitest";

import { VeltryxKernel, createBootstrapContext } from "../src/index.js";

describe("VeltryxKernel", () => {
  it("initializes and reaches Kernel Ready", async () => {
    const kernel = new VeltryxKernel();
    const context = createBootstrapContext();

    await kernel.bootstrap(context);
    await kernel.initialize(context);
    const result = await kernel.ready(context);

    expect(result).toEqual({
      state: "ready",
      message: "Kernel Ready"
    });
    expect(kernel.state()).toBe("ready");
    expect(kernel.runtime().state()).toBe("ready");
  });
});

