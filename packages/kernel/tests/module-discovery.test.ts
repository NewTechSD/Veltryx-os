import { describe, expect, it } from "vitest";
import type { IModuleDiscoveryValidator } from "@veltryx/contracts";

import {
  KernelModuleCatalog,
  KernelModuleDescriptor,
  KernelModuleDiscovery,
  KernelModuleDiscoveryValidator
} from "../src/index.js";

const validManifest = {
  id: "kernel.discovery.sample",
  name: "Discovery Sample",
  version: "1.0.0",
  description: "Sample manifest used by discovery tests",
  author: "kernel",
  dependencies: [],
  compatibility: {
    kernel: "^1.0.0",
    runtime: "^1.0.0",
    metadata: "^1.0.0"
  },
  permissions: [],
  routes: [],
  metadata: [],
  events: [],
  providers: [],
  components: [],
  migrations: [],
  seeds: []
};

function manifest(id: string) {
  return {
    ...validManifest,
    id,
    name: `Module ${id}`
  };
}

describe("KernelModuleCatalog", () => {
  it("starts empty", () => {
    const catalog = new KernelModuleCatalog();

    expect(catalog.list()).toEqual([]);
    expect(catalog.has(validManifest.id)).toBe(false);
    expect(catalog.find(validManifest.id)).toBeUndefined();
  });

  it("registers, locates, lists and removes modules", () => {
    const catalog = new KernelModuleCatalog();
    const descriptor = new KernelModuleDescriptor(validManifest);

    catalog.register(descriptor);

    expect(catalog.has(validManifest.id)).toBe(true);
    expect(catalog.find(validManifest.id)).toBe(descriptor);
    expect(catalog.list()).toEqual([descriptor]);
    expect(catalog.remove(validManifest.id)).toBe(true);
    expect(catalog.remove(validManifest.id)).toBe(false);
    expect(catalog.list()).toEqual([]);
  });

  it("prevents duplicate module ids", () => {
    const catalog = new KernelModuleCatalog();
    const descriptor = new KernelModuleDescriptor(validManifest);

    catalog.register(descriptor);

    expect(() => catalog.register(descriptor)).toThrow(
      "Module already cataloged: kernel.discovery.sample"
    );
  });
});

describe("KernelModuleDiscovery", () => {
  it("discovers an empty catalog from an empty candidate list", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([]);

    expect(result).toMatchObject({
      total: 0,
      found: [],
      valid: [],
      invalid: [],
      duplicated: [],
      ignored: [],
      errors: []
    });
    expect(result.report).toEqual({
      total: 0,
      found: 0,
      valid: 0,
      invalid: 0,
      duplicated: 0,
      ignored: 0,
      errors: [],
      warnings: []
    });
  });

  it("discovers one valid module", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([validManifest]);

    expect(result.total).toBe(1);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]).toMatchObject({ manifest: validManifest, state: "discovered" });
    expect(result.invalid).toEqual([]);
    expect(result.duplicated).toEqual([]);
    expect(discovery.getCatalog().has(validManifest.id)).toBe(true);
  });

  it("discovers multiple valid modules", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([manifest("kernel.a"), manifest("kernel.b")]);

    expect(result.total).toBe(2);
    expect(result.valid.map((descriptor) => descriptor.manifest.id)).toEqual(["kernel.a", "kernel.b"]);
    expect(discovery.getCatalog().list()).toHaveLength(2);
  });

  it("rejects an invalid module and keeps it out of the catalog", () => {
    const discovery = new KernelModuleDiscovery();
    const invalidManifest = { ...validManifest, permissions: "broken" };

    const result = discovery.discover([invalidManifest]);

    expect(result.valid).toEqual([]);
    expect(result.invalid).toHaveLength(1);
    expect(result.ignored).toEqual([
      expect.objectContaining({ candidate: invalidManifest, reason: "invalid" })
    ]);
    expect(discovery.getCatalog().list()).toEqual([]);
  });

  it("detects duplicate modules and ignores the duplicate candidate", () => {
    const discovery = new KernelModuleDiscovery();
    const first = manifest("kernel.duplicate");
    const second = { ...first, name: "Duplicate Module" };

    const result = discovery.discover([first, second]);

    expect(result.valid).toHaveLength(1);
    expect(result.duplicated).toHaveLength(1);
    expect(result.duplicated[0]).toMatchObject({ id: "kernel.duplicate", candidate: second });
    expect(result.ignored).toEqual([
      expect.objectContaining({ candidate: second, reason: "duplicate" })
    ]);
    expect(discovery.getCatalog().list()).toHaveLength(1);
  });

  it("detects duplicates against an existing catalog", () => {
    const catalog = new KernelModuleCatalog();
    catalog.register(new KernelModuleDescriptor(validManifest));
    const discovery = new KernelModuleDiscovery(catalog);

    const result = discovery.discover([{ ...validManifest, name: "Already Present" }]);

    expect(result.valid).toEqual([]);
    expect(result.duplicated).toHaveLength(1);
    expect(result.report.duplicated).toBe(1);
  });

  it("reports manifest without id", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([{ ...validManifest, id: "" }]);

    expect(result.invalid[0]?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "id" })])
    );
  });

  it("reports manifest without version", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([{ ...validManifest, version: "" }]);

    expect(result.invalid[0]?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "version" })])
    );
  });

  it("reports manifest without name", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([{ ...validManifest, name: "" }]);

    expect(result.invalid[0]?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })])
    );
  });

  it("reports invalid compatibility", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([{ ...validManifest, compatibility: [] }]);

    expect(result.invalid[0]?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "compatibility" })])
    );
  });

  it("reports empty manifest candidates", () => {
    const discovery = new KernelModuleDiscovery();

    const result = discovery.discover([{}]);

    expect(result.invalid).toHaveLength(1);
    expect(result.report.invalid).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports a defensive error when validation succeeds without a manifest", () => {
    const validator: IModuleDiscoveryValidator = {
      validate: () => ({ valid: true, issues: [] })
    };
    const discovery = new KernelModuleDiscovery(new KernelModuleCatalog(), validator);
    const candidate = { id: "kernel.missing.manifest" };

    const result = discovery.discover([candidate]);

    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([
      {
        candidate,
        issues: [{ field: "manifest", message: "validated manifest is missing" }]
      }
    ]);
    expect(result.ignored).toEqual([
      expect.objectContaining({ candidate, reason: "invalid" })
    ]);
  });

  it("ignores a defensive duplicate without an existing descriptor", () => {
    const validator: IModuleDiscoveryValidator = {
      validate: () => ({
        valid: false,
        duplicate: true,
        manifest: validManifest,
        issues: [{ field: "id", message: "module id must be unique: kernel.discovery.sample" }]
      })
    };
    const discovery = new KernelModuleDiscovery(new KernelModuleCatalog(), validator);

    const result = discovery.discover([validManifest]);

    expect(result.valid).toEqual([]);
    expect(result.duplicated).toEqual([]);
    expect(result.ignored).toEqual([
      expect.objectContaining({ candidate: validManifest, reason: "duplicate" })
    ]);
  });

  it("builds a complete discovery report", () => {
    const discovery = new KernelModuleDiscovery();
    const first = manifest("kernel.report");
    const duplicate = { ...first, name: "Duplicate Report" };
    const invalid = { ...validManifest, id: "" };

    const result = discovery.discover([first, duplicate, invalid]);

    expect(result.report).toMatchObject({
      total: 3,
      found: 3,
      valid: 1,
      invalid: 1,
      duplicated: 1,
      ignored: 2
    });
    expect(result.report.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.report.warnings).toEqual([
      "module candidate ignored: duplicate",
      "module candidate ignored: invalid"
    ]);
  });
});

describe("KernelModuleDiscoveryValidator", () => {
  it("reports identification conflicts as discovery validation issues", () => {
    const catalog = new KernelModuleCatalog();
    const validator = new KernelModuleDiscoveryValidator();
    const discoveredIds = new Set<string>([validManifest.id]);

    const result = validator.validate(validManifest, catalog, discoveredIds);

    expect(result).toMatchObject({ valid: false, duplicate: true, manifest: validManifest });
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "id" })])
    );
  });
});

