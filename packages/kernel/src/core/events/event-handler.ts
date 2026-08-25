export type { EventHandler, EventHandlerResult } from "@veltryx/contracts";

export function assertEventHandler(handler: unknown): asserts handler is (...args: unknown[]) => unknown {
  if (typeof handler !== "function") {
    throw new Error("Event handler must be a function");
  }
}
