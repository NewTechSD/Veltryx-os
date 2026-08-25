import type { KernelStatusCard } from "../lib/kernel-status";

import { StatusCard } from "./status-card";

export function StatusTile({ item }: Readonly<{ item: KernelStatusCard }>) {
  return <StatusCard card={item} />;
}
