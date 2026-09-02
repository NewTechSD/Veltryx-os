import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DiagnosticsPage from "../app/diagnostics/page";
import RootLayout from "../app/layout";
import AdminHome from "../app/page";
import { GET as healthGet } from "../app/health/route";
import StatusPage from "../app/status/page";
import { DiagnosticsPanel } from "../components/diagnostics-panel";
import { StatusSummary } from "../components/status-summary";
import { createDiagnosticsStatus } from "./diagnostics-status";
import { createHealthStatusResponse } from "./health-status";
import type { KernelStatusSnapshot } from "./kernel-status";

const baseSnapshot: KernelStatusSnapshot = {
  kernelStatus: "ready",
  bootStatus: "ready",
  bootTimestamp: "2026-08-18T12:00:00.000Z",
  environment: "test",
  servicesRegistered: { status: "available", value: 1, detail: "Services provided by Kernel snapshot." },
  modulesDiscovered: { status: "available", value: 10, detail: "Discovered provided by Kernel snapshot." },
  modulesResolved: { status: "available", value: 8, detail: "Resolved provided by Kernel snapshot." },
  modulesLoaded: { status: "available", value: 7, detail: "Loaded provided by Kernel snapshot." },
  moduleSystemStatus: {
    status: "available",
    discovered: { status: "available", value: 10, detail: "Discovered provided by Kernel snapshot." },
    resolved: { status: "available", value: 8, detail: "Resolved provided by Kernel snapshot." },
    loaded: { status: "available", value: 7, detail: "Loaded provided by Kernel snapshot." }
  },
  metadataRegistryStatus: { status: "available", detail: "Metadata status provided by Kernel snapshot." },
  runtimeStatus: "ready",
  warnings: [
    {
      code: "KERNEL_WARNING",
      message: "Controlled warning",
      severity: "warning",
      source: "kernel",
      detail: "Warning detail"
    }
  ],
  errors: [],
  diagnostics: [
    {
      code: "KERNEL_WARNING",
      message: "Controlled warning",
      severity: "warning",
      source: "kernel",
      detail: "Warning detail"
    }
  ]
};

describe("/health", () => {
  it("returns status ok when the Kernel is healthy", async () => {
    const response = await healthGet();
    const payload = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(payload.status).toBe("ok");
    expect(payload.kernel).toBe("ready");
    expect(payload.timestamp).toEqual(expect.any(String));
  });

  it("returns status error for a controlled Kernel failure", () => {
    const payload = createHealthStatusResponse({ ...baseSnapshot, kernelStatus: "error" });

    expect(payload).toEqual({
      status: "error",
      kernel: "error",
      timestamp: "2026-08-18T12:00:00.000Z"
    });
  });

  it("does not expose stack traces or excessive details", () => {
    const payload = createHealthStatusResponse({
      ...baseSnapshot,
      kernelStatus: "error",
      errors: [
        {
          code: "KERNEL_BOOTSTRAP_FAILED",
          message: "Bootstrap failed",
          severity: "error",
          source: "bootstrap",
          stack: "Error: Bootstrap failed"
        }
      ]
    });

    expect(Object.keys(payload)).toEqual(["status", "kernel", "timestamp"]);
    expect(JSON.stringify(payload)).not.toContain("Bootstrap failed");
    expect(JSON.stringify(payload)).not.toContain("stack");
  });
});

describe("/status", () => {
  it("renders public Kernel status fields from the snapshot", () => {
    const html = renderToStaticMarkup(<StatusSummary snapshot={baseSnapshot} />);

    expect(html).toContain("Status");
    expect(html).toContain("ready");
    expect(html).toContain("Services Registered");
    expect(html).toContain("Modules Loaded");
    expect(html).toContain("7");
    expect(html).toContain("KERNEL_WARNING");
  });

  it("does not break when fields are unavailable", () => {
    const html = renderToStaticMarkup(
      <StatusSummary
        snapshot={{
          ...baseSnapshot,
          modulesLoaded: { status: "unavailable", detail: "Loaded modules unavailable." },
          moduleSystemStatus: {
            ...baseSnapshot.moduleSystemStatus,
            status: "unavailable",
            loaded: { status: "unavailable", detail: "Loaded modules unavailable." }
          },
          metadataRegistryStatus: { status: "notImplemented", detail: "Metadata summary not implemented." },
          runtimeStatus: "unavailable"
        }}
      />
    );

    expect(html).toContain("unavailable");
    expect(html).toContain("notImplemented");
    expect(html).toContain("Loaded modules unavailable.");
  });
});

describe("/diagnostics", () => {
  it("renders structured diagnostics", () => {
    const diagnostics = createDiagnosticsStatus(baseSnapshot, {
      appName: "@veltryx/admin",
      appVersion: "0.1.0",
      uptimeSeconds: 12,
      includeTechnicalDetails: true
    });
    const html = renderToStaticMarkup(<DiagnosticsPanel diagnostics={diagnostics} />);

    expect(html).toContain("Diagnostics");
    expect(html).toContain("@veltryx/admin");
    expect(html).toContain("0.1.0");
    expect(html).toContain("2026-08-18T12:00:00.000Z");
    expect(html).toContain("KERNEL_WARNING");
  });

  it("marks absent app data and uptime as unavailable", () => {
    const diagnostics = createDiagnosticsStatus(baseSnapshot, {
      appName: undefined,
      appVersion: undefined,
      environment: "preview"
    });

    expect(diagnostics.appName).toEqual(expect.any(String));
    expect(diagnostics.appVersion).toEqual(expect.any(String));
    expect(diagnostics.environment).toBe("preview");
    expect(diagnostics.uptime).toBe("unavailable");
  });

  it("does not expose stack traces in production", () => {
    const diagnostics = createDiagnosticsStatus(
      {
        ...baseSnapshot,
        environment: "production",
        errors: [
          {
            code: "KERNEL_BOOTSTRAP_FAILED",
            message: "Bootstrap failed",
            severity: "error",
            source: "bootstrap",
            stack: "Error: Bootstrap failed"
          }
        ],
        diagnostics: [
          {
            code: "KERNEL_BOOTSTRAP_FAILED",
            message: "Bootstrap failed",
            severity: "error",
            source: "bootstrap",
            stack: "Error: Bootstrap failed"
          }
        ]
      },
      { includeTechnicalDetails: false }
    );

    expect(JSON.stringify(diagnostics)).not.toContain("Error: Bootstrap failed");
    expect(diagnostics.errors[0]).not.toHaveProperty("stack");
  });

  it("uses modulesLoaded from the public snapshot without recalculating it", () => {
    const diagnostics = createDiagnosticsStatus(baseSnapshot, { includeTechnicalDetails: false });

    expect(diagnostics.moduleSystemStatus.loaded.value).toBe(7);
  });
});

describe("Admin operational pages", () => {
  it("renders the home shell", async () => {
    const html = renderToStaticMarkup(await AdminHome());

    expect(html).toContain("Kernel readiness overview");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Diagnostics");
  });

  it("renders the status page server-side", async () => {
    const html = renderToStaticMarkup(await StatusPage());

    expect(html).toContain("Public Kernel Snapshot");
    expect(html).toContain("Modules Loaded");
  });

  it("renders the diagnostics page server-side", async () => {
    const html = renderToStaticMarkup(await DiagnosticsPage());

    expect(html).toContain("Operational Diagnostics");
    expect(html).toContain("Module System");
  });

  it("renders the root layout", () => {
    const html = renderToStaticMarkup(<RootLayout>content</RootLayout>);

    expect(html).toContain("content");
  });
});
