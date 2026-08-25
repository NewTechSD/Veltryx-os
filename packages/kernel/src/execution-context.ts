import type { ExecutionContextInput, IExecutionContext } from "@veltryx/contracts";

import { KernelExecutionContextFactory } from "./core/execution-context/index.js";

export function createExecutionContext(input: ExecutionContextInput = {}): IExecutionContext {
  return new KernelExecutionContextFactory().create(input);
}

export {
  KernelExecutionContext,
  KernelExecutionContextFactory,
  KernelExecutionContextValidator,
  KernelRequestContext,
  KernelTenantContext,
  KernelUserContext,
  KernelWorkspaceContext,
  createExecutionContextSnapshot
} from "./core/execution-context/index.js";