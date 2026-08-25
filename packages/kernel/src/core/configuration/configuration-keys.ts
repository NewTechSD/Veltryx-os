import { CONFIGURATION_KEYS, type ConfigurationKey } from "@veltryx/contracts";

export { CONFIGURATION_KEYS };
export const OFFICIAL_CONFIGURATION_KEYS = Object.freeze(
  Object.values(CONFIGURATION_KEYS)
) as readonly ConfigurationKey[];
export const SENSITIVE_CONFIGURATION_KEY_PATTERN =
  /(?:secret|token|password|credential|private[._-]?key|api[._-]?key)/i;
