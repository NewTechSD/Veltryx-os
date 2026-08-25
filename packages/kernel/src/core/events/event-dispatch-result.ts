export type { EventDispatchError, EventDispatchResult } from "@veltryx/contracts";

export function createEmptyDispatchResult(input: {
  readonly eventId: string;
  readonly eventName: string;
  readonly handlersMatched: number;
  readonly warnings?: readonly string[];
  readonly dispatchedAt?: Date;
}) {
  return {
    eventId: input.eventId,
    eventName: input.eventName,
    handlersMatched: input.handlersMatched,
    handlersExecuted: 0,
    handlersSucceeded: 0,
    handlersFailed: 0,
    errors: [],
    warnings: input.warnings ?? [],
    dispatchedAt: input.dispatchedAt ?? new Date()
  };
}
