import type { IWorkspaceContext } from "@veltryx/contracts";

export class KernelWorkspaceContext implements IWorkspaceContext {
  constructor(
    readonly workspaceId: string,
    readonly workspaceSlug: string | undefined = undefined,
    readonly workspaceName: string | undefined = undefined
  ) {
    Object.freeze(this);
  }
}