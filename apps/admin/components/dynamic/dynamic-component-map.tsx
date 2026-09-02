import type { ComponentType } from "react";
import type { DynamicComponentProps } from "./dynamic-components";
import { DynamicBadge, DynamicButton, DynamicCard, DynamicContainer, DynamicEmptyState, DynamicErrorState, DynamicGrid, DynamicHeading, DynamicPage, DynamicSection, DynamicStack, DynamicStatusIndicator, DynamicText } from "./dynamic-components";

export const adminDynamicComponentMap: Readonly<Record<string, ComponentType<DynamicComponentProps>>> = Object.freeze({
  "system.page": DynamicPage, "system.section": DynamicSection, "system.container": DynamicContainer,
  "system.card": DynamicCard, "system.grid": DynamicGrid, "system.stack": DynamicStack,
  "system.heading": DynamicHeading, "system.text": DynamicText, "system.badge": DynamicBadge,
  "system.button": DynamicButton, "system.emptyState": DynamicEmptyState, "system.errorState": DynamicErrorState,
  "system.statusIndicator": DynamicStatusIndicator
});
