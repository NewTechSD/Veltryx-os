import type { EventHandler, EventSubscription, EventSubscriptionInput } from "@veltryx/contracts";

import { assertEventHandler } from "./event-handler.js";

let subscriptionSequence = 0;

export class KernelEventSubscription<TPayload = unknown> implements EventSubscription<TPayload> {
  readonly subscriptionId: string;
  readonly eventName: string;
  readonly handler: EventHandler<TPayload>;
  readonly createdAt: Date;

  constructor(input: EventSubscriptionInput<TPayload>, now: () => Date = () => new Date()) {
    assertEventName(input.eventName);
    assertEventHandler(input.handler);

    this.subscriptionId = input.subscriptionId ?? `sub-${Date.now()}-${++subscriptionSequence}`;
    assertSubscriptionId(this.subscriptionId);
    this.eventName = input.eventName;
    this.handler = input.handler;
    this.createdAt = now();
  }
}

export function assertEventName(eventName: unknown): asserts eventName is string {
  if (typeof eventName !== "string" || eventName.trim().length === 0) {
    throw new Error("Event name must be a non-empty string");
  }
}

export function assertSubscriptionId(subscriptionId: unknown): asserts subscriptionId is string {
  if (typeof subscriptionId !== "string" || subscriptionId.trim().length === 0) {
    throw new Error("Event subscription id must be a non-empty string");
  }
}
