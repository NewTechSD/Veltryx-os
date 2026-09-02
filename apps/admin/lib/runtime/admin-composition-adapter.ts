import { VeltryxKernel } from "@veltryx/kernel";
import type {
  AdminCompositionIssueViewModel,
  AdminCompositionNodeViewModel,
  AdminCompositionScreenViewModel,
  AdminCompositionTreeViewModel
} from "./admin-composition-view-model";

export type AdminCompositionSourceType = "page" | "view" | "form" | "list" | "menu" | "custom";

export interface AdminCompositionScreenInput {
  readonly namespace: string;
  readonly sourceType: string;
  readonly sourceId: string;
}

interface PublicIssue {
  readonly code: string;
  readonly message: string;
  readonly severity?: "info" | "warning" | "error";
  readonly source: string;
  readonly timestamp?: string;
}

interface PublicNode {
  readonly id: string;
  readonly componentKey: string;
  readonly componentVersion?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly children?: readonly PublicNode[];
  readonly slots?: Readonly<Record<string, readonly PublicNode[]>>;
}

interface PublicTree {
  readonly id: string;
  readonly source: string;
  readonly sourceType: AdminCompositionSourceType;
  readonly generatedAt: string;
  readonly root: PublicNode;
  readonly warnings: readonly PublicIssue[];
  readonly errors: readonly PublicIssue[];
  readonly diagnostics: readonly PublicIssue[];
}

interface AdminCompositionKernel {
  metadata(): {
    registerPage(page: DemoPage, options?: { readonly override?: boolean; readonly source?: string }): unknown;
    resolvePage(namespace: string, id: string): { readonly found: boolean; readonly resource?: { readonly definition?: unknown }; readonly error?: PublicIssue };
    snapshot(): { readonly resourcesRegistered: number };
  };
  components(): { snapshot(): { readonly componentsRegistered: number } };
  uiComposition(): { compose(input: Readonly<Record<string, unknown>>): PublicTree; snapshot(): unknown };
  runtime(): { snapshot(): { readonly servicesRegistered?: number; readonly providersRegistered?: number; readonly modulesLoaded?: number } | undefined };
  status(): { snapshot(): Promise<{ readonly servicesRegistered?: { readonly value?: number }; readonly modulesLoaded?: { readonly value?: number } }> };
}

interface DemoPage {
  readonly id: string;
  readonly namespace: string;
  readonly title: string;
  readonly route: string;
  readonly sections: readonly DemoSection[];
}

interface DemoSection { readonly id: string; readonly type: string; readonly title: string; readonly resource?: string; readonly children?: readonly DemoSection[] }

export interface AdminCompositionAdapterOptions {
  readonly createKernel?: () => AdminCompositionKernel;
  readonly now?: () => Date;
}

const SOURCE_TYPES = new Set<AdminCompositionSourceType>(["page", "view", "form", "list", "menu", "custom"]);

export async function getAdminCompositionScreenViewModel(
  input: AdminCompositionScreenInput,
  options: AdminCompositionAdapterOptions = {}
): Promise<AdminCompositionScreenViewModel> {
  const generatedAt = (options.now ?? (() => new Date()))().toISOString();
  if (!SOURCE_TYPES.has(input.sourceType as AdminCompositionSourceType))
    return errorViewModel(input, generatedAt, "adminComposition.invalidSourceType", "Unsupported composition source type.");

  try {
    const kernel = options.createKernel?.() ?? (new VeltryxKernel() as unknown as AdminCompositionKernel);
    if (input.sourceType === "page" && input.namespace === "system" && input.sourceId === "admin-overview") {
      const metadataSnapshot = kernel.metadata().snapshot();
      const componentSnapshot = kernel.components().snapshot();
      const runtimeSnapshot = kernel.runtime().snapshot();
      const statusSnapshot = await kernel.status().snapshot();
      kernel.uiComposition().snapshot();
      kernel.metadata().registerPage(createDemoPage({
        components: componentSnapshot.componentsRegistered,
        metadata: metadataSnapshot.resourcesRegistered,
        services: runtimeSnapshot?.servicesRegistered ?? statusSnapshot.servicesRegistered?.value ?? 0,
        providers: runtimeSnapshot?.providersRegistered ?? 0,
        modules: runtimeSnapshot?.modulesLoaded ?? statusSnapshot.modulesLoaded?.value ?? 0
      }), { override: true, source: "admin-composition-adapter" });
    }

    const resolved = kernel.metadata().resolvePage(input.namespace, input.sourceId);
    if (!resolved.found || !resolved.resource?.definition) {
      const issue = resolved.error;
      return errorViewModel(input, generatedAt, issue?.code ?? "adminComposition.sourceMissing", "The requested composition source is unavailable.");
    }

    const tree = kernel.uiComposition().compose({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      namespace: input.namespace,
      metadata: resolved.resource.definition
    });
    return mapTreeToViewModel(input, tree);
  } catch {
    return errorViewModel(input, generatedAt, "adminComposition.failed", "The dynamic screen could not be composed.");
  }
}

function createDemoPage(counts: { components: number; metadata: number; services: number; providers: number; modules: number }): DemoPage {
  const metric = (id: string, title: string, value: number): DemoSection => ({ id, type: "card", title, resource: String(value) });
  return {
    id: "admin-overview", namespace: "system", title: "Runtime Dynamic Overview", route: "/runtime/page/system/admin-overview",
    sections: [{ id: "runtime-summary", type: "container", title: "Public runtime snapshots", children: [
      metric("components", "Components registered", counts.components), metric("metadata", "Metadata resources", counts.metadata + 1),
      metric("services", "Services available", counts.services), metric("providers", "DI providers", counts.providers),
      metric("modules", "Modules loaded", counts.modules), metric("compositions", "UI compositions generated", 1)
    ] }]
  };
}

function mapTreeToViewModel(input: AdminCompositionScreenInput, tree: PublicTree): AdminCompositionScreenViewModel {
  const warnings = Object.freeze(tree.warnings.map((issue) => normalizeIssue(issue, "warning")));
  const errors = Object.freeze(tree.errors.map((issue) => normalizeIssue(issue, "error")));
  const diagnostics = Object.freeze(tree.diagnostics.map((issue) => normalizeIssue(issue, issue.severity ?? "info")));
  const status = errors.length ? "error" : warnings.length ? "warning" : tree.root ? "ready" : "empty";
  return Object.freeze({ status, title: safeText(tree.root.props?.title) ?? "Dynamic screen", description: "Rendered from a universal Composition Tree.", sourceType: input.sourceType, sourceId: input.sourceId, namespace: input.namespace, generatedAt: tree.generatedAt, tree: mapTree(tree), warnings, errors, diagnostics });
}

function mapTree(tree: PublicTree): AdminCompositionTreeViewModel {
  return Object.freeze({ id: tree.id, source: tree.source, sourceType: tree.sourceType, generatedAt: tree.generatedAt, root: mapNode(tree.root) });
}

function mapNode(node: PublicNode): AdminCompositionNodeViewModel {
  const slots = Object.fromEntries(Object.entries(node.slots ?? {}).map(([name, nodes]) => [name, Object.freeze(nodes.map(mapNode))]));
  return Object.freeze({ id: node.id, componentKey: node.componentKey, componentVersion: node.componentVersion, props: sanitizeProps(node.props), children: Object.freeze((node.children ?? []).map(mapNode)), slots: Object.freeze(slots) });
}

function sanitizeProps(props: Readonly<Record<string, unknown>> | undefined): Readonly<Record<string, unknown>> {
  const safe = Object.entries(props ?? {}).filter(([key, value]) => key !== "className" && key !== "style" && key !== "dangerouslySetInnerHTML" && typeof value !== "function");
  return Object.freeze(Object.fromEntries(safe));
}

function normalizeIssue(issue: PublicIssue, severity: "info" | "warning" | "error"): AdminCompositionIssueViewModel {
  return Object.freeze({ code: safeText(issue.code) ?? "composition.issue", message: safeText(issue.message) ?? "Composition issue.", severity, source: safeText(issue.source) ?? "ui-composition", timestamp: safeText(issue.timestamp) });
}

function errorViewModel(input: AdminCompositionScreenInput, generatedAt: string, code: string, message: string): AdminCompositionScreenViewModel {
  const issue = Object.freeze({ code, message, severity: "error" as const, source: "admin-composition-adapter" });
  return Object.freeze({ status: "error", title: "Dynamic screen unavailable", description: "Return to Status or Diagnostics for operational information.", sourceType: input.sourceType, sourceId: input.sourceId, namespace: input.namespace, generatedAt, warnings: Object.freeze([]), errors: Object.freeze([issue]), diagnostics: Object.freeze([issue]) });
}

function safeText(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.slice(0, 500) : undefined; }
