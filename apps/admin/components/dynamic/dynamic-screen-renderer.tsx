import { DynamicErrorState, DynamicEmptyState } from "./dynamic-components";
import { DynamicNodeRenderer } from "./dynamic-node-renderer";
import type { AdminCompositionScreenViewModel } from "../../lib/runtime/admin-composition-view-model";

export function DynamicScreenRenderer({ viewModel }: Readonly<{ viewModel: AdminCompositionScreenViewModel }>) {
  if (viewModel.status === "error" || !viewModel.tree) {
    const Component = viewModel.status === "empty" ? DynamicEmptyState : DynamicErrorState;
    return <Component nodeId="screen-state" props={{ title: viewModel.title, description: viewModel.description }} slots={{}}>{null}</Component>;
  }
  return <div data-dynamic-screen-status={viewModel.status}><DynamicNodeRenderer node={viewModel.tree.root} />{viewModel.warnings.length > 0 && <aside className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{viewModel.warnings.length} composition warning(s).</aside>}</div>;
}
