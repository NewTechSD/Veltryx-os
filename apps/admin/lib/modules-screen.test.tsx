import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ModulesPage from "../app/modules/page";
import { ModuleDependenciesList } from "../components/modules/module-dependencies-list";
import { ModuleDiagnosticsList } from "../components/modules/module-diagnostics-list";
import { ModuleSystemScreen } from "../components/modules/module-system-screen";
import { ModulesList } from "../components/modules/modules-list";
import { Sidebar } from "../components/sidebar";
import type { ModuleSystemViewModel } from "./module-system-view-model";

function viewModel(overrides: Partial<ModuleSystemViewModel> = {}): ModuleSystemViewModel {
  return {
    status: "ready",
    statusLabel: "Ready",
    statusDescription: "The Module System public snapshot is available.",
    generatedAt: "2026-08-25T12:00:00.000Z",
    summary: {
      modulesDiscovered: 4,
      modulesValid: 3,
      modulesInvalid: 1,
      modulesDuplicated: 2,
      modulesResolved: 3,
      modulesLoaded: 2,
      modulesRejected: 1
    },
    modules: [
      {
        id: "veltryx.sample",
        name: "Sample Module",
        version: "1.2.3",
        description: "A public sample module.",
        state: "loaded",
        stateLabel: "Loaded",
        status: "warning",
        statusLabel: "Warning",
        discoveryStatus: "valid",
        discoveryStatusLabel: "Valid",
        resolutionStatus: "resolved",
        resolutionStatusLabel: "Resolved",
        loadingStatus: "loaded",
        loadingStatusLabel: "Loaded",
        dependenciesCount: 1,
        optionalDependenciesCount: 1,
        warningsCount: 1,
        errorsCount: 0,
        dependencies: [
          {
            moduleId: "veltryx.core",
            required: true,
            requiredLabel: "Required",
            version: "^1.0.0",
            status: "resolved",
            statusLabel: "Resolved"
          }
        ],
        optionalDependencies: [
          {
            moduleId: "veltryx.audit",
            required: false,
            requiredLabel: "Optional",
            status: "optionalMissing",
            statusLabel: "Optional missing",
            reason: "Not installed in this environment."
          }
        ],
        warnings: [
          {
            code: "OPTIONAL_MISSING",
            message: "Optional dependency missing.",
            severity: "warning",
            source: "resolution"
          }
        ],
        errors: []
      }
    ],
    warnings: [
      {
        code: "SYSTEM_WARNING",
        message: "Snapshot is degraded.",
        severity: "warning",
        source: "module-system"
      }
    ],
    errors: [],
    diagnostics: [
      {
        code: "SNAPSHOT_READY",
        message: "Snapshot collected.",
        severity: "info",
        source: "snapshot",
        details: "Public diagnostic detail."
      }
    ],
    isEmpty: false,
    hasWarnings: true,
    hasErrors: false,
    hasModules: true,
    ...overrides
  };
}

describe("Modules page", () => {
  it("renders server-side and consumes the public adapter", async () => {
    const html = renderToStaticMarkup(await ModulesPage());
    const source = readFileSync(new URL("../app/modules/page.tsx", import.meta.url), "utf8");

    expect(html).toContain("Module System");
    expect(html).toContain("Nenhum módulo encontrado ainda.");
    expect(source).toContain("getModuleSystemViewModel");
    expect(source).not.toContain("@veltryx/kernel");
    expect(source).not.toMatch(/ModuleRegistry|ModuleLoader|DependencyResolver|ModuleDiscovery/);
  });
});

describe("Module System screen", () => {
  it("renders summary, module lifecycle, counters, dependencies and diagnostics", () => {
    const html = renderToStaticMarkup(<ModuleSystemScreen viewModel={viewModel()} />);

    for (const value of [
      "Ready",
      "The Module System public snapshot is available.",
      "2026-08-25T12:00:00.000Z",
      "Discovered",
      "Valid",
      "Invalid",
      "Duplicated",
      "Resolved",
      "Loaded",
      "Rejected",
      "Sample Module",
      "veltryx.sample",
      "1.2.3",
      "Discovery",
      "Resolution",
      "Loading",
      "1 required dependencies",
      "1 optional dependencies",
      "1 warnings",
      "0 errors",
      "veltryx.core",
      "Required",
      "^1.0.0",
      "veltryx.audit",
      "Optional",
      "Optional missing",
      "Not installed in this environment.",
      "SYSTEM_WARNING",
      "SNAPSHOT_READY",
      "Public diagnostic detail."
    ]) {
      expect(html).toContain(value);
    }
  });

  it("renders the empty state without treating it as an error", () => {
    const html = renderToStaticMarkup(
      <ModuleSystemScreen
        viewModel={viewModel({
          status: "empty",
          statusLabel: "Empty",
          modules: [],
          isEmpty: true,
          hasModules: false,
          warnings: [],
          diagnostics: [],
          hasWarnings: false
        })}
      />
    );

    expect(html).toContain("Nenhum módulo encontrado ainda.");
    expect(html).toContain("nenhum módulo foi descoberto");
    expect(html).not.toContain("Module System indisponível.");
  });

  it("renders partial availability from existing ViewModel fields", () => {
    const html = renderToStaticMarkup(
      <ModuleSystemScreen
        viewModel={viewModel({
          status: "partial",
          modules: [],
          isEmpty: false,
          hasModules: false,
          errors: [],
          diagnostics: []
        })}
      />
    );

    expect(html).toContain("Module System parcialmente disponível.");
    expect(html).toContain("Modules: unavailable");
    expect(html).toContain("Warnings: available");
    expect(html).toContain("Errors: unavailable");
    expect(html).toContain("Diagnostics: unavailable");
    expect(html).toContain("No module records available.");
  });

  it("renders a controlled error and normalized records", () => {
    const errors = [
      {
        code: "SNAPSHOT_FAILED",
        message: "Module System snapshot unavailable.",
        severity: "error" as const,
        source: "admin"
      }
    ];
    const html = renderToStaticMarkup(
      <ModuleSystemScreen
        viewModel={viewModel({ status: "error", errors, diagnostics: errors, hasErrors: true })}
      />
    );

    expect(html).toContain("Module System indisponível.");
    expect(html).toContain("SNAPSHOT_FAILED");
    expect(html).toContain("Module System snapshot unavailable.");
    expect(html).not.toContain("stack trace");
  });

  it("shows an error banner when hasErrors is true independently of status", () => {
    const html = renderToStaticMarkup(
      <ModuleSystemScreen viewModel={viewModel({ hasErrors: true, errors: [] })} />
    );
    expect(html).toContain("Module System indisponível.");
    expect(html).not.toContain("error record(s) available below");
  });
});

describe("Module presentation components", () => {
  it("handles empty dependency and diagnostic arrays", () => {
    const html = renderToStaticMarkup(
      <>
        <ModuleDependenciesList title="Required dependencies" dependencies={[]} />
        <ModuleDiagnosticsList title="Diagnostics" tone="neutral" entries={[]} />
      </>
    );
    expect(html).toContain("No dependencies.");
    expect(html).toContain("None.");
  });

  it("handles an empty modules array", () => {
    expect(renderToStaticMarkup(<ModulesList modules={[]} />)).toContain(
      "No module records available."
    );
  });

  it("does not invent an absent module description, dependency version, reason or diagnostic details", () => {
    const model = viewModel();
    const moduleCard = {
      ...model.modules[0]!,
      description: undefined,
      dependencies: [
        {
          moduleId: "veltryx.core",
          required: true,
          requiredLabel: "Required",
          status: "resolved" as const,
          statusLabel: "Resolved"
        }
      ],
      optionalDependencies: [],
      warnings: [],
      errors: []
    };
    const html = renderToStaticMarkup(
      <ModuleSystemScreen
        viewModel={{ ...model, modules: [moduleCard], warnings: [], errors: [], diagnostics: [] }}
      />
    );
    expect(html).not.toContain("A public sample module.");
    expect(html).toContain("No dependencies.");
  });

  it("keeps all sidebar destinations and links Modules to its route", () => {
    const html = renderToStaticMarkup(<Sidebar />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/status"');
    expect(html).toContain('href="/diagnostics"');
    expect(html).toContain('href="/modules"');
  });
});
