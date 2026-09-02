import { VeltryxKernel } from "@veltryx/kernel";
import { isNavigationItemActive, normalizeCurrentPath, sanitizeInternalHref, sanitizeNavigationId, sanitizeNavigationText } from "./admin-navigation-sanitizer";
import type { AdminNavigationGroupViewModel, AdminNavigationIssueViewModel, AdminNavigationItemViewModel, AdminNavigationViewModel } from "./admin-navigation-view-model";

export interface AdminNavigationInput { readonly currentPath?: string; readonly namespace?: string; readonly menuId?: string }
export interface AdminNavigationAdapterOptions { readonly createKernel?: () => AdminNavigationKernel; readonly now?: () => Date }

interface PublicIssue { readonly code: string; readonly message: string; readonly severity?: "info" | "warning" | "error"; readonly source: string }
interface MenuItemData { readonly id?: unknown; readonly label?: unknown; readonly route?: unknown; readonly badge?: unknown; readonly description?: unknown; readonly children?: unknown; readonly action?: unknown }
interface MenuDefinition { readonly id: string; readonly namespace: string; readonly label: string; readonly items: readonly MenuItemData[] }
interface MenuTree { readonly generatedAt: string; readonly root: { readonly componentKey: string; readonly props?: Readonly<Record<string, unknown>> }; readonly warnings: readonly PublicIssue[]; readonly errors: readonly PublicIssue[]; readonly diagnostics: readonly PublicIssue[] }
interface AdminNavigationKernel {
  metadata(): { registerMenu(menu: MenuDefinition, options?: { readonly override?: boolean; readonly source?: string }): unknown; resolveMenu(namespace: string, id: string): { readonly found: boolean; readonly resource?: { readonly definition?: unknown }; readonly error?: PublicIssue } };
  uiComposition(): { compose(input: Readonly<Record<string, unknown>>): MenuTree };
}

const DEMO_MENU: MenuDefinition = Object.freeze({
  id: "admin-main", namespace: "system", label: "Main navigation", items: Object.freeze([
    { id: "dashboard", label: "Dashboard", route: "/" },
    { id: "modules", label: "Modules", route: "/modules" },
    { id: "dynamic-screen", label: "Dynamic Screen", route: "/runtime/page/system/admin-overview" },
    { id: "status", label: "Status", route: "/status" },
    { id: "diagnostics", label: "Diagnostics", route: "/diagnostics" },
    { id: "health", label: "Health", route: "/health" }
  ])
});

export function getAdminNavigationViewModel(input: AdminNavigationInput = {}, options: AdminNavigationAdapterOptions = {}): AdminNavigationViewModel {
  const namespace = sanitizeNavigationId(input.namespace) ?? "system";
  const menuId = sanitizeNavigationId(input.menuId) ?? "admin-main";
  const generatedAt = (options.now ?? (() => new Date()))().toISOString();
  const currentPath = normalizeCurrentPath(input.currentPath);
  try {
    const kernel = options.createKernel?.() ?? (new VeltryxKernel() as unknown as AdminNavigationKernel);
    if (namespace === "system" && menuId === "admin-main") kernel.metadata().registerMenu(DEMO_MENU, { override: true, source: "admin-navigation-adapter" });
    const resolved = kernel.metadata().resolveMenu(namespace, menuId);
    if (!resolved.found || !resolved.resource?.definition) return failure(generatedAt, currentPath, resolved.error?.code ?? "adminNavigation.menuMissing", "Admin navigation is unavailable.");
    const tree = kernel.uiComposition().compose({ sourceType: "menu", sourceId: menuId, namespace, metadata: resolved.resource.definition });
    if (tree.root.componentKey !== "system.menu") return failure(tree.generatedAt, currentPath, "adminNavigation.invalidComposition", "Admin navigation composition is invalid.");
    return fromTree(tree, currentPath, menuId);
  } catch {
    return failure(generatedAt, currentPath, "adminNavigation.failed", "Admin navigation could not be composed.");
  }
}

function fromTree(tree: MenuTree, currentPath: string | undefined, menuId: string): AdminNavigationViewModel {
  const rawItems = Array.isArray(tree.root.props?.items) ? tree.root.props.items as readonly MenuItemData[] : [];
  const itemWarnings: AdminNavigationIssueViewModel[] = [];
  const items = rawItems.map((item, index) => mapItem(item, index, currentPath, itemWarnings)).filter((item): item is AdminNavigationItemViewModel => Boolean(item));
  const warnings = Object.freeze([...tree.warnings.map((issue) => mapIssue(issue, "warning")), ...itemWarnings]);
  const errors = Object.freeze(tree.errors.map((issue) => mapIssue(issue, "error")));
  const diagnostics = Object.freeze(tree.diagnostics.map((issue) => mapIssue(issue, issue.severity ?? "info")));
  const label = sanitizeNavigationText(tree.root.props?.label) ?? "Navigation";
  const groups: readonly AdminNavigationGroupViewModel[] = items.length ? Object.freeze([Object.freeze({ id: menuId, label, items: Object.freeze(items) })]) : Object.freeze([]);
  const status = errors.length ? "error" : !items.length ? "empty" : warnings.length ? "warning" : "ready";
  return freezeViewModel({ status, generatedAt: tree.generatedAt, currentPath, groups, warnings, errors, diagnostics });
}

function mapItem(item: MenuItemData, index: number, currentPath: string | undefined, warnings: AdminNavigationIssueViewModel[]): AdminNavigationItemViewModel | undefined {
  if (!item || typeof item !== "object" || typeof item.action === "function") return invalidItem(index, warnings);
  const id = sanitizeNavigationId(item.id);
  const label = sanitizeNavigationText(item.label);
  if (!id || !label) return invalidItem(index, warnings);
  const href = sanitizeInternalHref(item.route);
  const disabled = !href;
  if (disabled) warnings.push(Object.freeze({ code: "adminNavigation.invalidHref", message: `Navigation item ${id} has a blocked link.`, severity: "warning", source: "admin-navigation-adapter" }));
  return Object.freeze({ id, label, href: href ?? "#", active: href ? isNavigationItemActive(href, currentPath) : false, disabled, badge: sanitizeNavigationText(item.badge, 32), description: sanitizeNavigationText(item.description, 240) });
}

function invalidItem(index: number, warnings: AdminNavigationIssueViewModel[]): undefined {
  warnings.push(Object.freeze({ code: "adminNavigation.invalidItem", message: `Navigation item ${index + 1} was ignored.`, severity: "warning", source: "admin-navigation-adapter" }));
  return undefined;
}

function mapIssue(issue: PublicIssue, severity: "info" | "warning" | "error"): AdminNavigationIssueViewModel {
  return Object.freeze({ code: sanitizeNavigationText(issue.code) ?? "adminNavigation.issue", message: sanitizeNavigationText(issue.message, 300) ?? "Navigation issue.", severity, source: sanitizeNavigationText(issue.source) ?? "ui-composition" });
}

function failure(generatedAt: string, currentPath: string | undefined, code: string, message: string): AdminNavigationViewModel {
  const issue = Object.freeze({ code, message, severity: "error" as const, source: "admin-navigation-adapter" });
  return freezeViewModel({ status: "error", generatedAt, currentPath, groups: Object.freeze([]), warnings: Object.freeze([]), errors: Object.freeze([issue]), diagnostics: Object.freeze([issue]) });
}

function freezeViewModel(model: AdminNavigationViewModel): AdminNavigationViewModel {
  return Object.freeze({ ...model, groups: Object.freeze(model.groups.map((group) => Object.freeze({ ...group, items: Object.freeze([...group.items]) }))), warnings: Object.freeze([...model.warnings]), errors: Object.freeze([...model.errors]), diagnostics: Object.freeze([...model.diagnostics]) });
}
