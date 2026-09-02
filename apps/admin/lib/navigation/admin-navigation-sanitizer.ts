const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/;

export function sanitizeNavigationId(value: unknown): string | undefined {
  return typeof value === "string" && ID_PATTERN.test(value) ? value : undefined;
}

export function sanitizeNavigationText(value: unknown, maxLength = 120): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = [...value].map((character) => isControlCharacter(character) ? " " : character).join("").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export function sanitizeInternalHref(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.includes("\\") || [...value].some(isControlCharacter)) return undefined;
  return value.slice(0, 500);
}

export function normalizeCurrentPath(value: unknown): string | undefined {
  const href = sanitizeInternalHref(value);
  if (!href) return undefined;
  return href.split(/[?#]/, 1)[0] || "/";
}

export function isNavigationItemActive(href: string, currentPath: string | undefined): boolean {
  if (!currentPath) return false;
  const target = normalizeCurrentPath(href);
  if (!target) return false;
  return target === "/" ? currentPath === "/" : currentPath === target || currentPath.startsWith(`${target}/`);
}

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
}
