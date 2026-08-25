import { describe, expect, it } from "vitest";
import type { ConfigurationResolutionResult, IConfigurationSource } from "@veltryx/contracts";
import {
  CONFIGURATION_KEYS,
  ConfigurationProvider,
  ConfigurationValidator,
  DefaultConfigurationSource,
  EnvironmentConfigurationSource,
  InMemoryConfigurationSource,
  VeltryxKernel
} from "../src/index.js";

const generatedAt = new Date("2026-08-25T12:00:00.000Z");

describe("Configuration sources and resolution", () => {
  it("loads safe defaults", () => {
    expect(new DefaultConfigurationSource().load()).toEqual({
      "app.name": "Veltryx OS",
      "app.version": "0.1.0",
      environment: "development",
      "runtime.mode": "preview",
      "debug.enabled": false,
      "kernel.status.enabled": true,
      "events.structural.enabled": true,
      "modules.snapshot.enabled": true
    });
  });

  it("loads only allowlisted environment values and normalizes booleans", () => {
    const source = new EnvironmentConfigurationSource({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "preview",
      VELTRYX_ENV: "test",
      NEXT_PUBLIC_APP_NAME: "Configured Veltryx",
      NEXT_PUBLIC_APP_VERSION: "2.0.0",
      VELTRYX_RUNTIME_MODE: "test",
      VELTRYX_DEBUG: "1",
      DATABASE_PASSWORD: "must-not-leak"
    });

    expect(source.load()).toEqual({
      environment: "test",
      "app.name": "Configured Veltryx",
      "app.version": "2.0.0",
      "runtime.mode": "test",
      "debug.enabled": true
    });
    expect(JSON.stringify(source.load())).not.toContain("DATABASE_PASSWORD");
    expect(new EnvironmentConfigurationSource({ VELTRYX_DEBUG: "0" }).load()).toEqual({
      "debug.enabled": false
    });
    expect(new EnvironmentConfigurationSource({ VELTRYX_DEBUG: "perhaps" }).load()).toEqual({
      "debug.enabled": "perhaps"
    });
  });

  it("loads defensive in-memory values and applies in-memory > environment > defaults", () => {
    const input = { "app.name": "Memory App" };
    const source = new InMemoryConfigurationSource(input);
    input["app.name"] = "Mutated";
    expect(source.load()).toEqual({ "app.name": "Memory App" });

    const provider = new ConfigurationProvider({
      environment: { NEXT_PUBLIC_APP_NAME: "Environment App", VELTRYX_ENV: "preview" },
      overrides: { "app.name": "Memory App", environment: "test" }
    });
    expect(provider.getString("app.name")).toBe("Memory App");
    expect(provider.getString("environment")).toBe("test");
    expect(provider.getString("app.version")).toBe("0.1.0");
  });

  it("handles empty, invalid and failing sources without exposing stack traces", () => {
    const empty: IConfigurationSource = { name: "empty", type: "in-memory", load: () => ({}) };
    const failing: IConfigurationSource = {
      name: "failing",
      type: "in-memory",
      load: () => {
        throw new Error("secret stack detail");
      }
    };
    const provider = new ConfigurationProvider({
      sources: [
        new DefaultConfigurationSource(),
        empty,
        new InMemoryConfigurationSource({
          environment: "invalid",
          unknown: "value",
          API_TOKEN: "secret"
        }),
        failing
      ],
      now: () => generatedAt
    });
    const snapshot = provider.snapshot();

    expect(snapshot.environment).toBe("development");
    expect(snapshot.sources.map((source) => source.name)).toEqual([
      "defaults",
      "empty",
      "in-memory",
      "failing"
    ]);
    expect(snapshot.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "CONFIGURATION_ENVIRONMENT_INVALID",
        "CONFIGURATION_KEY_UNKNOWN",
        "CONFIGURATION_SENSITIVE_KEY_REJECTED",
        "CONFIGURATION_SOURCE_FAILED"
      ])
    );
    expect(JSON.stringify(snapshot)).not.toContain("secret stack detail");
    expect(JSON.stringify(snapshot)).not.toContain("API_TOKEN");
    expect(JSON.stringify(snapshot)).not.toContain("secret");
  });
});

describe("Configuration validator", () => {
  const validator = new ConfigurationValidator();

  it("accepts valid environments and runtime modes", () => {
    expect(validator.validateValue(CONFIGURATION_KEYS.environment, "production").valid).toBe(true);
    expect(validator.validateValue(CONFIGURATION_KEYS.runtimeMode, "preview").valid).toBe(true);
  });

  it("rejects invalid environments, runtime modes, required strings and booleans", () => {
    expect(validator.validateValue(CONFIGURATION_KEYS.environment, "staging").issues[0]?.code).toBe(
      "CONFIGURATION_ENVIRONMENT_INVALID"
    );
    expect(validator.validateValue(CONFIGURATION_KEYS.runtimeMode, "live").issues[0]?.code).toBe(
      "CONFIGURATION_RUNTIME_MODE_INVALID"
    );
    expect(validator.validateValue(CONFIGURATION_KEYS.appName, " ").issues[0]?.code).toBe(
      "CONFIGURATION_REQUIRED_STRING_INVALID"
    );
    expect(validator.validateValue(CONFIGURATION_KEYS.appVersion, "").valid).toBe(false);
    expect(validator.validateValue(CONFIGURATION_KEYS.debugEnabled, "true").issues[0]?.code).toBe(
      "CONFIGURATION_BOOLEAN_INVALID"
    );
  });

  it("validates structural numbers, unknown keys and missing required values", () => {
    expect(validator.validateNumber(10).valid).toBe(true);
    expect(validator.validateNumber(Number.NaN, "limit").issues[0]?.code).toBe(
      "CONFIGURATION_NUMBER_INVALID"
    );
    const result = validator.validate({ unknown: true } as never);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("CONFIGURATION_KEY_UNKNOWN");
    expect(result.issues.map((issue) => issue.code)).toContain(
      "CONFIGURATION_REQUIRED_VALUE_MISSING"
    );
  });
});

describe("Configuration provider and snapshot", () => {
  it("reads defaults by direct and legacy query APIs", async () => {
    const provider = new ConfigurationProvider({ environment: {} });
    expect(provider.get("environment")).toBe("development");
    await expect(provider.get<string>({ key: "app.name", scope: "global" })).resolves.toBe(
      "Veltryx OS"
    );
    expect(provider.getString("app.name")).toBe("Veltryx OS");
    expect(provider.getBoolean("debug.enabled")).toBe(false);
    expect(provider.getNumber("debug.enabled")).toBeUndefined();
    expect(provider.has("app.version")).toBe(true);
    expect(provider.has("unknown")).toBe(false);
    expect(provider.get("unknown")).toBeUndefined();
  });

  it("supports typed number reads without adding an undocumented operational key", () => {
    const resolution = {
      values: { [CONFIGURATION_KEYS.debugEnabled]: 42 },
      sources: [],
      warnings: [],
      errors: [],
      diagnostics: []
    } as unknown as ConfigurationResolutionResult;
    const provider = new ConfigurationProvider({
      resolver: { resolve: () => resolution },
      sources: []
    });
    expect(provider.getNumber(CONFIGURATION_KEYS.debugEnabled)).toBe(42);
    expect(provider.getBoolean(CONFIGURATION_KEYS.debugEnabled)).toBeUndefined();
  });

  it("creates a complete immutable and secret-free snapshot", () => {
    const provider = new ConfigurationProvider({
      now: () => generatedAt,
      environment: { DATABASE_URL: "private", VELTRYX_ENV: "test" }
    });
    const snapshot = provider.snapshot();

    expect(snapshot).toMatchObject({
      generatedAt: generatedAt.toISOString(),
      environment: "test",
      appName: "Veltryx OS",
      appVersion: "0.1.0",
      runtimeMode: "preview",
      debugEnabled: false
    });
    expect(snapshot.sources).toHaveLength(3);
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.diagnostics.length).toBeGreaterThan(0);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.sources)).toBe(true);
    expect(Object.isFrozen(snapshot.sources[0]?.loadedKeys)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("DATABASE_URL");
    expect(JSON.stringify(snapshot)).not.toContain("private");
  });
});

describe("Kernel configuration API", () => {
  it("exposes the provider, feeds official status values and does not change Kernel state", async () => {
    const kernel = new VeltryxKernel();
    const before = kernel.state();
    const configuration = kernel.configuration();
    const configurationSnapshot = configuration.snapshot();
    const status = await kernel.status().snapshot();

    expect(configuration.getString("environment")).toBe(configurationSnapshot.environment);
    expect(status.environment).toBe(configurationSnapshot.environment);
    expect(status.appName).toBe(configurationSnapshot.appName);
    expect(status.appVersion).toBe(configurationSnapshot.appVersion);
    expect(status.runtimeMode).toBe(configurationSnapshot.runtimeMode);
    expect(kernel.state()).toBe(before);
  });
});
