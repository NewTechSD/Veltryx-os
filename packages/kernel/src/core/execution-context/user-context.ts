import type { IUserContext } from "@veltryx/contracts";

export class KernelUserContext implements IUserContext {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];

  constructor(
    readonly userId: string,
    readonly email: string | undefined = undefined,
    readonly name: string | undefined = undefined,
    roles: readonly string[] = [],
    permissions: readonly string[] = []
  ) {
    this.roles = Object.freeze([...roles]);
    this.permissions = Object.freeze([...permissions]);
    Object.freeze(this);
  }
}