import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KernelDashboard } from "../components/kernel-dashboard";
import { getKernelStatusSnapshot } from "./kernel-status-adapter";
import { createKernelStatusViewModel, getKernelStatusViewModel } from "./kernel-status";

const fixedDate = new Date("2026-08-18T12:00:00.000Z");

describe("getKernelStatusSnapshot", () => {
  it("returns a valid snapshot from the real Kernel adapter", async () => {
    const snapshot = await getKernelStatusSnapshot({ environment: "test", now: () => fixedDate });

    expect(snapshot.kernelStatus).toBe("ready");
    expect(snapshot.bootStatus).toBe("ready");
    expect(snapshot.bootTimestamp).toEqual(expect.any(String));
    expect(snapshot.environment).toBe("test");
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.modulesDiscovered.status).toBe("available");
    expect(snapshot.modulesResolved.status).toBe("available");
    expect(snapshot.modulesLoaded.status).toBe("available");
    expect(snapshot.servicesRegistered.status).toBe("available");
    expect(snapshot.moduleSystemStatus.status).toBe("available");
    expect(snapshot.metadataRegistryStatus.status).toBe("available");
    expect(snapshot.runtimeStatus).toBe("ready");
    expect(snapshot.warnings[0]?.code).toBe("KERNEL_METADATA_GLOBAL_SUMMARY_NOT_IMPLEMENTED");
  });

  it("does not infer modulesLoaded when the Kernel snapshot already provides it", async () => {
    const snapshot = await getKernelStatusSnapshot({
      createKernel: () =>
        ({
          bootstrap: async () => undefined,
          initialize: async () => undefined,
          ready: async () => ({ state: "ready", message: "Kernel Ready" }),
          modules: () => {
            throw new Error("Admin adapter must not read module internals");
          },
          status: () => ({
            snapshot: async () => ({
              kernelStatus: "ready",
              bootStatus: "ready",
              bootTimestamp: "2026-08-18T12:00:00.000Z",
              environment: "test",
              modulesDiscovered: { status: "available", value: 10, detail: "Provided by Kernel." },
              modulesResolved: { status: "available", value: 8, detail: "Provided by Kernel." },
              modulesLoaded: { status: "available", value: 7, detail: "Provided by Kernel." },
              servicesRegistered: { status: "available", value: 1, detail: "Provided by Kernel." },
              moduleSystemStatus: {
                status: "available",
                discovered: { status: "available", value: 10, detail: "Provided by Kernel." },
                resolved: { status: "available", value: 8, detail: "Provided by Kernel." },
                loaded: { status: "available", value: 7, detail: "Provided by Kernel." }
              },
              metadataRegistryStatus: { status: "available", detail: "Provided by Kernel." },
              runtimeStatus: "ready",
              errors: [],
              warnings: [],
              diagnostics: []
            })
          })
        }) as never,
      environment: "test",
      now: () => fixedDate
    });

    expect(snapshot.modulesLoaded.value).toBe(7);
  });

  it("does not return the previous static mock values after integration", async () => {
    const dashboard = await getKernelStatusViewModel();

    expect(dashboard.generatedAt).not.toBe("Static bootstrap shell");
    expect(dashboard.cards.some((card) => card.value === "Not Connected")).toBe(false);
    expect(dashboard.cards.some((card) => card.value === "Not Started")).toBe(false);
    expect(dashboard.cards.map((card) => card.title)).toContain("Modules Discovered");
    expect(dashboard.cards.map((card) => card.title)).toContain("Modules Loaded");
  });

  it("returns a controlled error snapshot when Kernel bootstrap fails", async () => {
    const snapshot = await getKernelStatusSnapshot({
      createKernel: () =>
        ({
          bootstrap: async () => {
            throw new Error("Bootstrap failed");
          }
        }) as never,
      environment: "production",
      now: () => fixedDate
    });

    expect(snapshot.kernelStatus).toBe("error");
    expect(snapshot.bootStatus).toBe("failed");
    expect(snapshot.errors).toEqual([
      { code: "KERNEL_BOOTSTRAP_FAILED", message: "Bootstrap failed", severity: "error", source: "bootstrap", detail: undefined, stack: undefined }
    ]);
    expect(snapshot.modulesDiscovered.status).toBe("unavailable");
    expect(snapshot.metadataRegistryStatus.status).toBe("notBootstrapped");
    expect(snapshot.runtimeStatus).toBe("notBootstrapped");
  });

  it("keeps technical details only when explicitly allowed", async () => {
    const snapshot = await getKernelStatusSnapshot({
      createKernel: () =>
        ({
          bootstrap: async () => {
            throw new Error("Development failure");
          }
        }) as never,
      environment: "development",
      now: () => fixedDate
    });

    expect(snapshot.errors[0]?.message).toBe("Development failure");
    expect(snapshot.errors[0]?.stack).toContain("Development failure");
  });
});

describe("createKernelStatusViewModel", () => {
  it("maps unavailable fields to explicit dashboard states", () => {
    const dashboard = createKernelStatusViewModel({
      kernelStatus: "error",
      bootStatus: "failed",
      modulesDiscovered: { status: "unavailable", detail: "Discovery unavailable." },
      modulesResolved: { status: "notImplemented", detail: "Resolver snapshot not implemented." },
      modulesLoaded: { status: "notBootstrapped", detail: "Loader not bootstrapped." },
      moduleSystemStatus: {
        status: "unavailable",
        discovered: { status: "unavailable", detail: "Discovery unavailable." },
        resolved: { status: "notImplemented", detail: "Resolver snapshot not implemented." },
        loaded: { status: "notBootstrapped", detail: "Loader not bootstrapped." }
      },
      servicesRegistered: { status: "available", value: 0, detail: "Service registry is empty." },
      metadataRegistryStatus: { status: "unavailable", detail: "Metadata registry unavailable." },
      runtimeStatus: "notBootstrapped",
      environment: "test",
      errors: [{ code: "KERNEL_FAILED", message: "Kernel failed", severity: "error", source: "kernel" }],
      warnings: [],
      diagnostics: [{ code: "KERNEL_FAILED", message: "Kernel failed", severity: "error", source: "kernel" }]
    });

    expect(dashboard.statusLabel).toBe("Kernel Status: Error");
    expect(dashboard.cards.find((card) => card.id === "modules-discovered")?.state).toBe("Unavailable");
    expect(dashboard.cards.find((card) => card.id === "modules-resolved")?.state).toBe("Not Implemented");
    expect(dashboard.cards.find((card) => card.id === "modules-loaded")?.state).toBe("Not Bootstrapped");
    expect(dashboard.summary.errors).toBe(1);
  });

  it("renders the kernel dashboard with adapter data", async () => {
    const dashboard = await getKernelStatusViewModel();
    const html = renderToStaticMarkup(<KernelDashboard dashboard={dashboard} />);

    expect(html).toContain("Kernel readiness overview");
    expect(html).toContain("Modules Discovered");
    expect(html).toContain("Services Registered");
    expect(html).toContain("Environment");
  });
});
