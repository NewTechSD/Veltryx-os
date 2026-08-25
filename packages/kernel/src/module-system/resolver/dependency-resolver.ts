import type {
  IModuleCycleDetector,
  IModuleDependencyResolver,
  IModuleTopologicalSorter,
  IStructuralEventPublisher,
  ModuleCompatibility,
  ModuleDependencyConflictEntry,
  ModuleDependencyMissingEntry,
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleManifest
} from "@veltryx/contracts";

import {
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  normalizeStructuralEventError,
  publishStructuralEvent
} from "../../core/events/index.js";
import { KernelModuleCycleDetector } from "./cycle-detector.js";
import { KernelModuleDependencyGraph } from "./dependency-graph.js";
import { createKernelModuleDependencyResolutionResult } from "./resolution-result.js";
import { KernelModuleTopologicalSorter } from "./topological-sort.js";

const COMPATIBILITY_FIELDS = ["kernel", "runtime", "metadata"] as const;
const MODULE_RESOLUTION_METADATA = { source: "module-system", tags: ["module", "resolution", "structural"] } as const;

export class KernelModuleDependencyResolver implements IModuleDependencyResolver {
  constructor(
    private readonly cycleDetector: IModuleCycleDetector = new KernelModuleCycleDetector(),
    private readonly sorter: IModuleTopologicalSorter = new KernelModuleTopologicalSorter(),
    private readonly structuralEvents?: IStructuralEventPublisher
  ) {}

  resolve(modules: readonly ModuleDescriptor[]): ModuleDependencyResolutionResult {
    const startedAt = new Date();
    publishStructuralEvent(this.structuralEvents, {
      eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionStarted,
      eventType: "module",
      payload: {
        modulesCount: modules.length,
        startedAt: startedAt.toISOString()
      },
      metadata: MODULE_RESOLUTION_METADATA,
      occurredAt: startedAt
    });

    try {
      const graph = new KernelModuleDependencyGraph();
      const missing: ModuleDependencyMissingEntry[] = [];
      const conflicts: ModuleDependencyConflictEntry[] = [];

      for (const descriptor of [...modules].sort(compareDescriptorsById)) {
        conflicts.push(...validateDescriptorStructure(descriptor));

        if (!graph.hasModule(descriptor.manifest.id)) {
          graph.addModule(descriptor);
          continue;
        }

        conflicts.push({
          moduleId: descriptor.manifest.id,
          field: "id",
          message: `duplicate module id in dependency resolution: ${descriptor.manifest.id}`
        });
      }

      for (const descriptor of graph.getModuleIds().map((moduleId) => graph.getModule(moduleId))) {
        if (!descriptor) {
          continue;
        }

        if (!Array.isArray(descriptor.manifest.dependencies)) {
          continue;
        }

        for (const dependency of descriptor.manifest.dependencies) {
          const optional = dependency.optional === true;

          if (!graph.hasModule(dependency.id)) {
            missing.push({
              moduleId: descriptor.manifest.id,
              dependencyId: dependency.id,
              optional
            });
            continue;
          }

          graph.addDependency(descriptor.manifest.id, dependency.id, optional);
        }
      }

      const cycles = this.cycleDetector.detect(graph);
      const hasBlockingMissing = missing.some((entry) => !entry.optional);
      const hasBlockingIssues = hasBlockingMissing || conflicts.length > 0 || cycles.length > 0;
      const order = hasBlockingIssues ? [] : this.sorter.sort(graph);
      const result = createKernelModuleDependencyResolutionResult({
        analyzed: modules,
        order,
        missing,
        conflicts,
        cycles
      });
      const completedAt = new Date();

      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionCompleted,
        eventType: "module",
        payload: {
          modulesCount: modules.length,
          resolvedModules: result.resolved.length,
          missingDependencies: result.missing.length,
          cyclesDetected: result.cycles.length,
          completedAt: completedAt.toISOString()
        },
        metadata: MODULE_RESOLUTION_METADATA,
        occurredAt: completedAt
      });

      return result;
    } catch (error) {
      const failedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionFailed,
        eventType: "module",
        payload: {
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: MODULE_RESOLUTION_METADATA,
        occurredAt: failedAt
      });

      throw error;
    }
  }
}

function compareDescriptorsById(left: ModuleDescriptor, right: ModuleDescriptor): number {
  return left.manifest.id.localeCompare(right.manifest.id);
}

function validateDescriptorStructure(descriptor: ModuleDescriptor): readonly ModuleDependencyConflictEntry[] {
  const conflicts: ModuleDependencyConflictEntry[] = [];
  const manifest = descriptor.manifest as Partial<ModuleManifest>;
  const moduleId = isNonEmptyString(manifest.id) ? manifest.id : "<unknown>";

  if (!isNonEmptyString(manifest.id)) {
    conflicts.push({ moduleId, field: "id", message: "module id must be a non-empty string" });
  }

  if (!isNonEmptyString(manifest.name)) {
    conflicts.push({ moduleId, field: "name", message: `${moduleId} name must be a non-empty string` });
  }

  if (!isNonEmptyString(manifest.version)) {
    conflicts.push({
      moduleId,
      field: "version",
      message: `${moduleId} version must be a non-empty string`
    });
  }

  if (!Array.isArray(manifest.dependencies)) {
    conflicts.push({
      moduleId,
      field: "dependencies",
      message: `${moduleId} dependencies must be an array`
    });
  }

  conflicts.push(...validateCompatibility(moduleId, manifest.compatibility));

  return conflicts;
}

function validateCompatibility(
  moduleId: string,
  compatibility: unknown
): readonly ModuleDependencyConflictEntry[] {
  if (!isRecord(compatibility)) {
    return [
      {
        moduleId,
        field: "compatibility",
        message: `${moduleId} compatibility must be an object`
      }
    ];
  }

  const typedCompatibility = compatibility as Partial<ModuleCompatibility>;
  const conflicts: ModuleDependencyConflictEntry[] = [];

  for (const field of COMPATIBILITY_FIELDS) {
    if (typedCompatibility[field] !== undefined && !isNonEmptyString(typedCompatibility[field])) {
      conflicts.push({
        moduleId,
        field: `compatibility.${field}`,
        message: `${moduleId} compatibility.${field} must be a non-empty string`
      });
    }
  }

  return conflicts;
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}

function isNonEmptyString(candidate: unknown): candidate is string {
  return typeof candidate === "string" && candidate.trim().length > 0;
}
