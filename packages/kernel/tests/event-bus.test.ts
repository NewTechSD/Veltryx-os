import { describe, expect, it } from "vitest";
import type { EventEnvelope, EventSubscription } from "@veltryx/contracts";

import {
  InMemoryEventBus,
  KernelEventDispatcher,
  KernelEventPublisher,
  createEventEnvelope,
  createExecutionContext,
  validateEventMetadata
} from "../src/index.js";

const fixedDate = new Date("2026-08-18T12:00:00.000Z");

function createBus() {
  let id = 0;

  return new InMemoryEventBus({
    now: () => fixedDate,
    createEventId: () => `event-${++id}`
  });
}

describe("InMemoryEventBus", () => {
  it("publishes an event without handlers", async () => {
    const bus = createBus();

    const result = await bus.publish({
      eventName: "kernel.started",
      eventType: "kernel",
      payload: { ok: true }
    });

    expect(result).toEqual({
      eventId: "event-1",
      eventName: "kernel.started",
      handlersMatched: 0,
      handlersExecuted: 0,
      handlersSucceeded: 0,
      handlersFailed: 0,
      errors: [],
      warnings: ["No event handlers matched this event."],
      dispatchedAt: fixedDate
    });
    expect(bus.publishedEvents()).toHaveLength(1);
  });

  it("publishes an event with one handler", async () => {
    const bus = createBus();
    const received: unknown[] = [];

    await bus.subscribe("kernel.ready", (event) => {
      received.push(event.payload);
    });

    const result = await bus.publish({
      eventName: "kernel.ready",
      eventType: "kernel",
      payload: { ready: true }
    });

    expect(received).toEqual([{ ready: true }]);
    expect(result.handlersMatched).toBe(1);
    expect(result.handlersExecuted).toBe(1);
    expect(result.handlersSucceeded).toBe(1);
    expect(result.handlersFailed).toBe(0);
  });

  it("publishes an event with multiple handlers", async () => {
    const bus = createBus();
    const calls: string[] = [];

    await bus.subscribe("module.loaded", () => calls.push("a"));
    await bus.subscribe("module.loaded", async () => calls.push("b"));

    const result = await bus.publish({ eventName: "module.loaded", eventType: "module", payload: {} });

    expect(calls).toEqual(["a", "b"]);
    expect(result.handlersMatched).toBe(2);
    expect(result.handlersExecuted).toBe(2);
    expect(result.handlersSucceeded).toBe(2);
  });

  it("rejects invalid events and subscriptions", async () => {
    const bus = createBus();

    await expect(bus.publish({ eventName: "", eventType: "kernel", payload: {} })).rejects.toThrow(
      "Event eventName must be a non-empty string"
    );
    await expect(bus.publish({ eventName: "kernel.bad", eventType: "broken" as never, payload: {} })).rejects.toThrow(
      "Event type must be one of"
    );
    await expect(bus.subscribe("", () => undefined)).rejects.toThrow("Event name must be a non-empty string");
    await expect(bus.subscribe("kernel.bad", undefined as never)).rejects.toThrow("Event handler must be a function");
  });

  it("registers, lists and rejects duplicate event registrations", async () => {
    const bus = createBus();

    await bus.register({ name: "kernel.ready", version: "1.0.0", owner: "kernel" });

    await expect(bus.listEvents()).resolves.toEqual([
      { name: "kernel.ready", version: "1.0.0", owner: "kernel" }
    ]);
    await expect(bus.register({ name: "kernel.ready", version: "1.0.0", owner: "kernel" })).rejects.toThrow(
      "Event already registered: kernel.ready:1.0.0"
    );
  });
});

describe("Event subscriptions", () => {
  it("registers, lists and removes a subscription", async () => {
    const bus = createBus();
    const subscription = await bus.subscribe("kernel.ready", () => undefined);

    expect(subscription.subscriptionId).toEqual(expect.any(String));
    await expect(bus.listSubscriptions()).resolves.toEqual([subscription]);
    await expect(bus.listSubscriptions("kernel.ready")).resolves.toEqual([subscription]);
    await expect(bus.unsubscribe(subscription.subscriptionId)).resolves.toBe(true);
    await expect(bus.listSubscriptions()).resolves.toEqual([]);
  });

  it("unsubscribe prevents future execution", async () => {
    const bus = createBus();
    let calls = 0;
    const subscription = await bus.subscribe("kernel.ready", () => {
      calls += 1;
    });

    await bus.unsubscribe(subscription.subscriptionId);
    await bus.publish({ eventName: "kernel.ready", eventType: "kernel", payload: {} });

    expect(calls).toBe(0);
  });

  it("removes one subscription without affecting others", async () => {
    const bus = createBus();
    const calls: string[] = [];
    const first = await bus.subscribe("kernel.ready", () => calls.push("first"));
    await bus.subscribe("kernel.ready", () => calls.push("second"));

    await expect(bus.unsubscribe(first.subscriptionId)).resolves.toBe(true);
    await bus.publish({ eventName: "kernel.ready", eventType: "kernel", payload: {} });

    expect(calls).toEqual(["second"]);
  });

  it("handles unsubscribe of an unknown subscription", async () => {
    const bus = createBus();

    await expect(bus.unsubscribe("missing-subscription")).resolves.toBe(false);
  });
});

describe("KernelEventPublisher", () => {
  it("publishes through the Event Bus and returns Dispatch Result", async () => {
    const bus = createBus();
    const publisher = new KernelEventPublisher(bus);
    let received: EventEnvelope | undefined;

    await bus.subscribe("runtime.ready", (event) => {
      received = event;
    });

    const result = await publisher.publish({ eventName: "runtime.ready", eventType: "runtime", payload: { ready: true } });

    expect(result.eventId).toBe("event-1");
    expect(result.handlersSucceeded).toBe(1);
    expect(received).toMatchObject({ eventId: "event-1", eventName: "runtime.ready", eventType: "runtime" });
  });
});

describe("KernelEventDispatcher", () => {
  it("executes synchronous and asynchronous handlers", async () => {
    const dispatcher = new KernelEventDispatcher(() => fixedDate);
    const event = createEventEnvelope({ eventName: "kernel.ready", eventType: "kernel", payload: {} }, { createEventId: () => "event-1" });
    const calls: string[] = [];
    const subscriptions: EventSubscription[] = [
      { subscriptionId: "sub-1", eventName: "kernel.ready", handler: () => calls.push("sync"), createdAt: fixedDate },
      { subscriptionId: "sub-2", eventName: "kernel.ready", handler: async () => calls.push("async"), createdAt: fixedDate }
    ];

    const result = await dispatcher.dispatch(event, subscriptions);

    expect(calls).toEqual(["sync", "async"]);
    expect(result.handlersSucceeded).toBe(2);
  });

  it("captures sync and async errors while continuing other handlers", async () => {
    const dispatcher = new KernelEventDispatcher(() => fixedDate);
    const event = createEventEnvelope({ eventName: "kernel.ready", eventType: "kernel", payload: {} }, { createEventId: () => "event-1" });
    const calls: string[] = [];
    const subscriptions: EventSubscription[] = [
      { subscriptionId: "sub-1", eventName: "kernel.ready", handler: () => { throw new Error("sync failed"); }, createdAt: fixedDate },
      { subscriptionId: "sub-2", eventName: "kernel.ready", handler: async () => { throw new Error("async failed"); }, createdAt: fixedDate },
      { subscriptionId: "sub-3", eventName: "kernel.ready", handler: () => calls.push("after"), createdAt: fixedDate }
    ];

    const result = await dispatcher.dispatch(event, subscriptions);

    expect(calls).toEqual(["after"]);
    expect(result.handlersMatched).toBe(3);
    expect(result.handlersExecuted).toBe(3);
    expect(result.handlersSucceeded).toBe(1);
    expect(result.handlersFailed).toBe(2);
    expect(result.errors).toEqual([
      expect.objectContaining({ subscriptionId: "sub-1", message: "sync failed", code: "EVENT_HANDLER_FAILED" }),
      expect.objectContaining({ subscriptionId: "sub-2", message: "async failed", code: "EVENT_HANDLER_FAILED" })
    ]);
    expect(result.dispatchedAt).toBe(fixedDate);
  });
});

describe("Event context and defensive behavior", () => {
  it("preserves ExecutionContextSnapshot fields", async () => {
    const context = createExecutionContext({
      tenant: "tenant-a",
      tenantId: "tenant-id-a",
      workspace: "workspace-a",
      workspaceId: "workspace-id-a",
      user: "user-a",
      userId: "user-id-a",
      requestId: "request-a",
      correlationId: "correlation-a"
    });
    const bus = createBus();
    let received: EventEnvelope | undefined;

    await bus.subscribe("kernel.context", (event) => {
      received = event;
    });

    await bus.publish({
      eventName: "kernel.context",
      eventType: "kernel",
      payload: {},
      contextSnapshot: context.snapshot()
    });

    expect(received?.contextSnapshot).toMatchObject({
      requestId: "request-a",
      correlationId: "correlation-a",
      tenantContext: { tenantId: "tenant-id-a" },
      workspaceContext: { workspaceId: "workspace-id-a" },
      userContext: { userId: "user-id-a" }
    });
  });

  it("normalizes legacy envelopes with execution context", async () => {
    const context = createExecutionContext({ requestId: "request-a", correlationId: "correlation-a" });
    const bus = createBus();

    await bus.publish({ name: "kernel.legacy", version: "1.0.0", payload: {}, occurredAt: fixedDate, context });

    expect(bus.publishedEvents()[0]).toMatchObject({
      eventId: "event-1",
      eventName: "kernel.legacy",
      eventType: "kernel",
      contextSnapshot: { requestId: "request-a", correlationId: "correlation-a" }
    });
  });

  it("rejects malformed metadata", () => {
    expect(() => validateEventMetadata(null)).toThrow("Event metadata must be an object when provided");
    expect(() => validateEventMetadata({ tags: "bad" })).toThrow("Event metadata tags must be an array when provided");
    expect(() => validateEventMetadata({ tags: [""] })).toThrow("Event metadata tags must contain only non-empty strings");
  });

  it("prevents mutation of stored envelopes", async () => {
    const bus = createBus();

    await bus.publish({ eventName: "kernel.immutable", eventType: "kernel", payload: { ok: true } });
    const envelope = bus.publishedEvents()[0];

    expect(Object.isFrozen(envelope)).toBe(true);
  });
});
