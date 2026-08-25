import type {
  ExecutionContextInput,
  ExecutionContextValidationIssue,
  ExecutionContextValidationResult,
  IExecutionContext,
  IExecutionContextValidator
} from "@veltryx/contracts";

const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+\/[A-Za-z_+.-]+(?:\/[A-Za-z_+.-]+)?)$/;

export class KernelExecutionContextValidator implements IExecutionContextValidator {
  validate(input: ExecutionContextInput | IExecutionContext): ExecutionContextValidationResult {
    const issues: ExecutionContextValidationIssue[] = [];

    validateRequiredString("tenant", readTenant(input), issues);
    validateRequiredString("requestId", input.requestId, issues);
    validateRequiredString("correlationId", input.correlationId, issues);

    if (input.locale !== undefined && !LOCALE_PATTERN.test(input.locale)) {
      issues.push({ field: "locale", message: "locale must use a structural locale format" });
    }

    if (input.timezone !== undefined && !TIMEZONE_PATTERN.test(input.timezone)) {
      issues.push({ field: "timezone", message: "timezone must use a structural timezone format" });
    }

    if (input.roles !== undefined && !isStringArray(input.roles)) {
      issues.push({ field: "roles", message: "roles must be an array of strings" });
    }

    if (input.permissions !== undefined && !isStringArray(input.permissions)) {
      issues.push({ field: "permissions", message: "permissions must be an array of strings" });
    }

    if (input.userContext?.roles !== undefined && !isStringArray(input.userContext.roles)) {
      issues.push({ field: "userContext.roles", message: "userContext.roles must be an array of strings" });
    }

    if (
      input.userContext?.permissions !== undefined &&
      !isStringArray(input.userContext.permissions)
    ) {
      issues.push({
        field: "userContext.permissions",
        message: "userContext.permissions must be an array of strings"
      });
    }

    return { valid: issues.length === 0, issues };
  }
}

function readTenant(input: ExecutionContextInput | IExecutionContext): unknown {
  return input.tenantContext?.tenantId ?? ("tenantId" in input ? input.tenantId : undefined) ?? input.tenant;
}

function validateRequiredString(
  field: string,
  value: unknown,
  issues: ExecutionContextValidationIssue[]
): void {
  if (!isNonEmptyString(value)) {
    issues.push({ field, message: `${field} must be a non-empty string` });
  }
}

function isStringArray(candidate: readonly unknown[]): candidate is readonly string[] {
  return Array.isArray(candidate) && candidate.every(isNonEmptyString);
}

function isNonEmptyString(candidate: unknown): candidate is string {
  return typeof candidate === "string" && candidate.trim().length > 0;
}