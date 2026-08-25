import { describe, expect, it } from "vitest";

import {
  KernelModuleLoader,
  KernelModuleManifestParser,
  KernelModuleManifestValidator,
  KernelModuleVersion
} from "../src/index.js";

const validManifest = {
  id: "kernel.sample",
  name: "Kernel Sample",
  version: "1.0.0",
  description: "Sample manifest used by kernel tests",
  author: "kernel",
  dependencies: [
    {
      id: "kernel.base",
      version: "^1.0.0",
      optional: true
    }
  ],
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

describe("KernelModuleManifestParser", () => {
  it("parses a valid module manifest object", () => {
    const parser = new KernelModuleManifestParser();

    expect(parser.parse(validManifest)).toEqual(validManifest);
  });

  it("rejects a JSON string manifest candidate", () => {
    const parser = new KernelModuleManifestParser();

    expect(() => parser.parse(JSON.stringify(validManifest))).toThrow("manifest must be an object");
  });

  it("represents a module version without resolving compatibility", () => {
    const version = new KernelModuleVersion("1.0.0");

    expect(version.value).toBe("1.0.0");
  });

  it("rejects an invalid module version representation", () => {
    expect(() => new KernelModuleVersion("")).toThrow("Module version must be a non-empty string");
  });

  it("parses a version through the manifest parser", () => {
    const parser = new KernelModuleManifestParser();

    expect(parser.parseVersion("2.0.0")).toEqual({ value: "2.0.0" });
    expect(() => parser.parseVersion(undefined)).toThrow("Module version must be a non-empty string");
  });
});

describe("KernelModuleManifestValidator", () => {
  it("accepts a valid manifest", () => {
    const validator = new KernelModuleManifestValidator();

    expect(validator.validate(validManifest)).toEqual({ valid: true, issues: [] });
  });

  it("reports missing id", () => {
    const validator = new KernelModuleManifestValidator();

    expect(validator.validate({ ...validManifest, id: "" }).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "id" })])
    );
  });

  it("reports missing version", () => {
    const validator = new KernelModuleManifestValidator();

    expect(validator.validate({ ...validManifest, version: "" }).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "version" })])
    );
  });

  it("reports missing name", () => {
    const validator = new KernelModuleManifestValidator();

    expect(validator.validate({ ...validManifest, name: "" }).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })])
    );
  });

  it("reports an invalid manifest candidate", () => {
    const validator = new KernelModuleManifestValidator();

    expect(validator.validate(null)).toEqual({
      valid: false,
      issues: [{ field: "manifest", message: "manifest must be an object" }]
    });
  });

  it("reports malformed optional text fields", () => {
    const validator = new KernelModuleManifestValidator();

    const result = validator.validate({ ...validManifest, description: 1, author: false });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "description" }),
        expect.objectContaining({ field: "author" })
      ])
    );
  });

  it("reports missing manifest collections", () => {
    const validator = new KernelModuleManifestValidator();

    const result = validator.validate({ ...validManifest, routes: undefined });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "routes" })])
    );
  });

  it("reports malformed dependencies", () => {
    const validator = new KernelModuleManifestValidator();

    const result = validator.validate({
      ...validManifest,
      dependencies: [{ version: 1, optional: "yes" }, "broken"]
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "dependencies.0.id" }),
        expect.objectContaining({ field: "dependencies.0.version" }),
        expect.objectContaining({ field: "dependencies.0.optional" }),
        expect.objectContaining({ field: "dependencies.1" })
      ])
    );
  });

  it("reports invalid compatibility", () => {
    const validator = new KernelModuleManifestValidator();

    const result = validator.validate({
      ...validManifest,
      compatibility: {
        kernel: "",
        runtime: 1
      }
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "compatibility.kernel" }),
        expect.objectContaining({ field: "compatibility.runtime" })
      ])
    );
  });

  it("reports non-string entries in manifest collections", () => {
    const validator = new KernelModuleManifestValidator();

    const result = validator.validate({ ...validManifest, permissions: ["module.read", 1] });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "permissions.1" })])
    );
  });
});

describe("KernelModuleLoader manifest validation", () => {
  it("validates a manifest before registration", async () => {
    const loader = new KernelModuleLoader();

    await expect(loader.validate(validManifest)).resolves.toEqual({
      valid: true,
      issues: []
    });

    await expect(loader.register(validManifest)).resolves.toMatchObject({
      manifest: validManifest,
      state: "discovered"
    });
  });

  it("rejects invalid manifests", async () => {
    const loader = new KernelModuleLoader();

    await expect(
      loader.register({
        ...validManifest,
        compatibility: []
      })
    ).rejects.toThrow("Invalid module manifest");
  });

  it("lists and returns registered manifests without resolving dependencies", async () => {
    const loader = new KernelModuleLoader();

    await loader.register(validManifest);

    await expect(loader.discover()).resolves.toEqual([]);
    await expect(loader.list()).resolves.toHaveLength(1);
    await expect(loader.resolveDependencies()).resolves.toMatchObject({
      order: [expect.objectContaining({ manifest: validManifest })]
    });
  });

  it("rejects duplicate registration", async () => {
    const loader = new KernelModuleLoader();

    await loader.register(validManifest);

    await expect(loader.register(validManifest)).rejects.toThrow(
      "Module already registered: kernel.sample"
    );
  });

  it("rejects transition for unknown modules", async () => {
    const loader = new KernelModuleLoader();

    await expect(loader.transition("missing.module", "validated")).rejects.toThrow(
      "Module not registered: missing.module"
    );
  });
});
