import type {
  IModuleCatalog,
  IModuleDiscovery,
  IModuleDiscoveryValidator,
  IStructuralEventPublisher,
  ModuleDescriptor,
  ModuleDiscoveryDuplicateEntry,
  ModuleDiscoveryIgnoredEntry,
  ModuleDiscoveryInvalidEntry,
  ModuleDiscoveryResult
} from "@veltryx/contracts";

import {
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  normalizeStructuralEventError,
  publishStructuralEvent
} from "../../core/events/index.js";
import { KernelModuleCatalog } from "./module-catalog.js";
import { KernelModuleDescriptor } from "./module-descriptor.js";
import { KernelModuleDiscoveryValidator } from "./discovery-validator.js";
import { createKernelModuleDiscoveryResult } from "./discovery-result.js";

const MODULE_DISCOVERY_METADATA = { source: "module-system", tags: ["module", "discovery", "structural"] } as const;

export class KernelModuleDiscovery implements IModuleDiscovery {
  constructor(
    private readonly moduleCatalog: IModuleCatalog = new KernelModuleCatalog(),
    private readonly validator: IModuleDiscoveryValidator = new KernelModuleDiscoveryValidator(),
    private readonly structuralEvents?: IStructuralEventPublisher
  ) {}

  discover(candidates: readonly unknown[]): ModuleDiscoveryResult {
    const startedAt = new Date();
    publishStructuralEvent(this.structuralEvents, {
      eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
      eventType: "module",
      payload: {
        candidatesCount: candidates.length,
        startedAt: startedAt.toISOString()
      },
      metadata: MODULE_DISCOVERY_METADATA,
      occurredAt: startedAt
    });

    try {
      const valid: ModuleDescriptor[] = [];
      const invalid: ModuleDiscoveryInvalidEntry[] = [];
      const duplicated: ModuleDiscoveryDuplicateEntry[] = [];
      const ignored: ModuleDiscoveryIgnoredEntry[] = [];
      const discoveredIds = new Set<string>();

      for (const candidate of candidates) {
        const validation = this.validator.validate(candidate, this.moduleCatalog, discoveredIds);

        if (!validation.valid) {
          if (validation.duplicate && validation.manifest) {
            const existing = this.moduleCatalog.find(validation.manifest.id) ?? findDescriptor(valid, validation.manifest.id);

            if (existing) {
              duplicated.push({
                id: validation.manifest.id,
                candidate: validation.manifest,
                existing,
                issues: validation.issues
              });
            }

            ignored.push({ candidate, reason: "duplicate", issues: validation.issues });
            continue;
          }

          invalid.push({ candidate, issues: validation.issues });
          ignored.push({ candidate, reason: "invalid", issues: validation.issues });
          continue;
        }

        if (!validation.manifest) {
          const issues = [{ field: "manifest", message: "validated manifest is missing" }];
          invalid.push({ candidate, issues });
          ignored.push({ candidate, reason: "invalid", issues });
          continue;
        }

        const descriptor = new KernelModuleDescriptor(validation.manifest);
        this.moduleCatalog.register(descriptor);
        discoveredIds.add(validation.manifest.id);
        valid.push(descriptor);
      }

      const result = createKernelModuleDiscoveryResult({
        found: candidates,
        valid,
        invalid,
        duplicated,
        ignored
      });
      const completedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryCompleted,
        eventType: "module",
        payload: {
          candidatesCount: candidates.length,
          validModules: result.valid.length,
          invalidModules: result.invalid.length,
          duplicatedModules: result.duplicated.length,
          completedAt: completedAt.toISOString()
        },
        metadata: MODULE_DISCOVERY_METADATA,
        occurredAt: completedAt
      });

      return result;
    } catch (error) {
      const failedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryFailed,
        eventType: "module",
        payload: {
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: MODULE_DISCOVERY_METADATA,
        occurredAt: failedAt
      });

      throw error;
    }
  }

  getCatalog(): IModuleCatalog {
    return this.moduleCatalog;
  }
}

function findDescriptor(
  descriptors: readonly ModuleDescriptor[],
  moduleId: string
): ModuleDescriptor | undefined {
  return descriptors.find((descriptor) => descriptor.manifest.id === moduleId);
}
