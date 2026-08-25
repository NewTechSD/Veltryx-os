import type {
  EventEnvelope,
  EventMetadata,
  EventPublishInput,
  EventType,
  LegacyEventEnvelope
} from "@veltryx/contracts";

import { validateEventMetadata } from "./event-metadata.js";
import { isKernelEventType } from "./event-types.js";

export interface EventEnvelopeFactoryOptions {
  readonly now?: () => Date;
  readonly createEventId?: () => string;
}

let sequence = 0;

export function createEventEnvelope<TPayload>(
  input: EventPublishInput<TPayload> | EventEnvelope<TPayload> | LegacyEventEnvelope<TPayload>,
  options: EventEnvelopeFactoryOptions = {}
): EventEnvelope<TPayload> {
  const normalized = normalizeEventInput(input, options);
  validateEventEnvelope(normalized);

  return Object.freeze({
    ...normalized,
    metadata: normalized.metadata ? Object.freeze({ ...normalized.metadata }) : undefined
  });
}

export function validateEventEnvelope(event: EventEnvelope): void {
  assertNonEmptyString(event.eventId, "eventId");
  assertNonEmptyString(event.eventName, "eventName");

  if (!isKernelEventType(event.eventType)) {
    throw new Error("Event type must be one of: kernel, module, metadata, runtime, system");
  }

  if (!(event.occurredAt instanceof Date) || Number.isNaN(event.occurredAt.getTime())) {
    throw new Error("Event occurredAt must be a valid Date");
  }

  validateEventMetadata(event.metadata);
}

function normalizeEventInput<TPayload>(
  input: EventPublishInput<TPayload> | EventEnvelope<TPayload> | LegacyEventEnvelope<TPayload>,
  options: EventEnvelopeFactoryOptions
): EventEnvelope<TPayload> {
  if ("eventName" in input) {
    return {
      eventId: input.eventId ?? createDefaultEventId(options),
      eventName: input.eventName,
      eventType: input.eventType,
      payload: input.payload,
      metadata: input.metadata,
      contextSnapshot: input.contextSnapshot,
      occurredAt: input.occurredAt ?? options.now?.() ?? new Date()
    };
  }

  const contextSnapshot = input.context?.snapshot();
  const metadata: EventMetadata = {
    source: "legacy-event-envelope",
    correlationId: contextSnapshot?.correlationId,
    tenantId: contextSnapshot?.tenantContext.tenantId,
    workspaceId: contextSnapshot?.workspaceContext?.workspaceId
  };

  return {
    eventId: createDefaultEventId(options),
    eventName: input.name,
    eventType: "kernel" as EventType,
    payload: input.payload,
    metadata,
    contextSnapshot,
    occurredAt: input.occurredAt
  };
}

function createDefaultEventId(options: EventEnvelopeFactoryOptions): string {
  return options.createEventId?.() ?? `evt-${Date.now()}-${++sequence}`;
}

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Event ${field} must be a non-empty string`);
  }
}
