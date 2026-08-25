import { VeltryxKernel } from "@veltryx/kernel";
import {
  createModuleSystemAdapterError,
  mapModuleDiagnosticToViewModel,
  mapModuleErrorToViewModel,
  mapModuleWarningToViewModel
} from "./module-system-diagnostics";
import {
  moduleDependencyRequiredLabel,
  moduleDependencyStatusLabel,
  moduleDiscoveryStatusLabel,
  moduleLoadingStatusLabel,
  moduleResolutionStatusLabel,
  moduleStateLabel,
  moduleStatusLabel,
  moduleSystemStatusDescription,
  moduleSystemStatusLabel
} from "./module-system-labels";
import type {
  AdminModuleDependencySnapshot,
  AdminModulePublicSnapshot,
  AdminModuleSystemSnapshot,
  ModuleCardViewModel,
  ModuleDependencyViewModel,
  ModuleSystemSummaryViewModel,
  ModuleSystemViewModel
} from "./module-system-view-model";

interface ModuleSystemKernelAdapter {
  modules(): {
    snapshot(): Promise<AdminModuleSystemSnapshot>;
  };
}

export interface ModuleSystemAdapterOptions {
  readonly createKernel?: () => ModuleSystemKernelAdapter;
  readonly environment?: string;
  readonly now?: () => Date;
  readonly includeTechnicalDetails?: boolean;
}

export async function getModuleSystemViewModel(
  options: ModuleSystemAdapterOptions = {}
): Promise<ModuleSystemViewModel> {
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const includeTechnicalDetails = options.includeTechnicalDetails ?? environment === "development";
  const generatedAt = (options.now ?? (() => new Date()))().toISOString();

  try {
    const kernel = options.createKernel?.() ?? new VeltryxKernel();
    const snapshot = await kernel.modules().snapshot();

    return mapModuleSystemSnapshotToViewModel(snapshot);
  } catch (error) {
    const issue = createModuleSystemAdapterError(error, { includeTechnicalDetails });

    return freezeModuleSystemViewModel({
      status: "error",
      statusLabel: moduleSystemStatusLabel("error"),
      statusDescription: moduleSystemStatusDescription("error"),
      generatedAt,
      summary: freezeSummary(emptySummary()),
      modules: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([issue]),
      diagnostics: Object.freeze([issue]),
      isEmpty: false,
      hasWarnings: false,
      hasErrors: true,
      hasModules: false
    });
  }
}

export function mapModuleSystemSnapshotToViewModel(snapshot: AdminModuleSystemSnapshot): ModuleSystemViewModel {
  const modules = Object.freeze(snapshot.modules.map(mapModuleToCardViewModel));
  const warnings = Object.freeze(snapshot.warnings.map(mapModuleWarningToViewModel));
  const errors = Object.freeze(snapshot.errors.map(mapModuleErrorToViewModel));
  const diagnostics = Object.freeze(snapshot.diagnostics.map(mapModuleDiagnosticToViewModel));

  return freezeModuleSystemViewModel({
    status: snapshot.status,
    statusLabel: moduleSystemStatusLabel(snapshot.status),
    statusDescription: moduleSystemStatusDescription(snapshot.status),
    generatedAt: snapshot.generatedAt,
    summary: freezeSummary({
      modulesDiscovered: snapshot.modulesDiscovered,
      modulesValid: snapshot.modulesValid,
      modulesInvalid: snapshot.modulesInvalid,
      modulesDuplicated: snapshot.modulesDuplicated,
      modulesResolved: snapshot.modulesResolved,
      modulesLoaded: snapshot.modulesLoaded,
      modulesRejected: snapshot.modulesRejected
    }),
    modules,
    warnings,
    errors,
    diagnostics,
    isEmpty: snapshot.status === "empty" || snapshot.modules.length === 0,
    hasWarnings: snapshot.warnings.length > 0,
    hasErrors: snapshot.errors.length > 0 || snapshot.status === "error",
    hasModules: snapshot.modules.length > 0
  });
}

export function mapModuleToCardViewModel(module: AdminModulePublicSnapshot): ModuleCardViewModel {
  const dependencies = Object.freeze(module.dependencies.map(mapDependencyToViewModel));
  const optionalDependencies = Object.freeze(module.optionalDependencies.map(mapDependencyToViewModel));
  const warnings = Object.freeze(module.warnings.map(mapModuleWarningToViewModel));
  const errors = Object.freeze(module.errors.map(mapModuleErrorToViewModel));

  return Object.freeze({
    id: module.id,
    name: module.name,
    version: module.version,
    description: module.description,
    state: module.state,
    stateLabel: moduleStateLabel(module.state),
    status: module.status,
    statusLabel: moduleStatusLabel(module.status),
    discoveryStatus: module.discoveryStatus,
    discoveryStatusLabel: moduleDiscoveryStatusLabel(module.discoveryStatus),
    resolutionStatus: module.resolutionStatus,
    resolutionStatusLabel: moduleResolutionStatusLabel(module.resolutionStatus),
    loadingStatus: module.loadingStatus,
    loadingStatusLabel: moduleLoadingStatusLabel(module.loadingStatus),
    dependenciesCount: dependencies.length,
    optionalDependenciesCount: optionalDependencies.length,
    warningsCount: warnings.length,
    errorsCount: errors.length,
    dependencies,
    optionalDependencies,
    warnings,
    errors
  });
}

export function mapDependencyToViewModel(dependency: AdminModuleDependencySnapshot): ModuleDependencyViewModel {
  return Object.freeze({
    moduleId: dependency.moduleId,
    required: dependency.required,
    requiredLabel: moduleDependencyRequiredLabel(dependency.required),
    version: dependency.version,
    status: dependency.status,
    statusLabel: moduleDependencyStatusLabel(dependency.status),
    reason: dependency.reason
  });
}

function emptySummary(): ModuleSystemSummaryViewModel {
  return {
    modulesDiscovered: 0,
    modulesValid: 0,
    modulesInvalid: 0,
    modulesDuplicated: 0,
    modulesResolved: 0,
    modulesLoaded: 0,
    modulesRejected: 0
  };
}

function freezeSummary(summary: ModuleSystemSummaryViewModel): ModuleSystemSummaryViewModel {
  return Object.freeze({ ...summary });
}

function freezeModuleSystemViewModel(viewModel: ModuleSystemViewModel): ModuleSystemViewModel {
  return Object.freeze({
    ...viewModel,
    summary: freezeSummary(viewModel.summary),
    modules: Object.freeze([...viewModel.modules]),
    warnings: Object.freeze([...viewModel.warnings]),
    errors: Object.freeze([...viewModel.errors]),
    diagnostics: Object.freeze([...viewModel.diagnostics])
  });
}

export type {
  AdminModuleDependencySnapshot,
  AdminModulePublicSnapshot,
  AdminModuleSystemSnapshot,
  ModuleCardViewModel,
  ModuleDependencyViewModel,
  ModuleSystemSummaryViewModel,
  ModuleSystemViewModel
} from "./module-system-view-model";