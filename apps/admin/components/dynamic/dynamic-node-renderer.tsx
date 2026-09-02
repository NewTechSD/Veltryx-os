import { adminDynamicComponentMap } from "./dynamic-component-map";
import { UnsupportedComponent } from "./dynamic-components";
import type { AdminCompositionNodeViewModel } from "../../lib/runtime/admin-composition-view-model";

export function DynamicNodeRenderer({ node }: Readonly<{ node: AdminCompositionNodeViewModel }>) {
  const Component = adminDynamicComponentMap[node.componentKey];
  if (!Component) return <UnsupportedComponent componentKey={node.componentKey} />;
  const children = node.children.map((child) => <DynamicNodeRenderer key={child.id} node={child} />);
  const slots = Object.fromEntries(Object.entries(node.slots).map(([name, slotNodes]) => [name, slotNodes.map((child) => <DynamicNodeRenderer key={child.id} node={child} />)]));
  return <Component nodeId={node.id} props={node.props} slots={slots}>{children}</Component>;
}
