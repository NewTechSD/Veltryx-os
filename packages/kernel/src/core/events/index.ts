export { InMemoryEventBus, type InMemoryEventBusOptions } from "./event-bus.js";
export { KernelEventDispatcher } from "./event-dispatcher.js";
export type { EventDispatchError, EventDispatchResult } from "./event-dispatch-result.js";
export { createEmptyDispatchResult } from "./event-dispatch-result.js";
export { createEventEnvelope, validateEventEnvelope, type EventEnvelopeFactoryOptions } from "./event-envelope.js";
export type { EventHandler, EventHandlerResult } from "./event-handler.js";
export { assertEventHandler } from "./event-handler.js";
export type { EventMetadata } from "./event-metadata.js";
export { validateEventMetadata } from "./event-metadata.js";
export { KernelEventPublisher } from "./event-publisher.js";
export { KernelEventSubscription, assertEventName, assertSubscriptionId } from "./event-subscription.js";
export type { EventType } from "./event-types.js";
export { KERNEL_EVENT_TYPES, isKernelEventType } from "./event-types.js";
export type {
  EventEnvelope,
  EventPublishInput,
  EventRegistration,
  EventSubscription,
  EventSubscriptionInput,
  IEventBus,
  IEventDispatcher,
  IEventPublisher,
  LegacyEventEnvelope
} from "@veltryx/contracts";
export {
  KERNEL_STRUCTURAL_EVENTS,
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  STRUCTURAL_EVENT_NAMES
} from "./structural-event-names.js";
export type {
  KernelBootstrapCompletedPayload,
  KernelBootstrapFailedPayload,
  KernelBootstrapStartedPayload,
  KernelReadyPayload,
  KernelStructuralEventPayload,
  ModuleDiscoveryCompletedPayload,
  ModuleDiscoveryFailedPayload,
  ModuleDiscoveryStartedPayload,
  ModuleLoadingCompletedPayload,
  ModuleLoadingFailedPayload,
  ModuleLoadingStartedPayload,
  ModuleResolutionCompletedPayload,
  ModuleResolutionFailedPayload,
  ModuleResolutionStartedPayload,
  ModuleSystemStructuralEventPayload,
  StructuralEventErrorPayload,
  StructuralEventPayload
} from "./structural-event-payloads.js";
export { normalizeStructuralEventError } from "./structural-event-payloads.js";
export { KernelStructuralEventPublisher, publishStructuralEvent } from "./structural-event-publisher.js";
export type {
  IStructuralEventPublisher,
  KernelStructuralEventName,
  ModuleSystemStructuralEventName,
  StructuralEventName,
  StructuralEventPublishInput
} from "@veltryx/contracts";
