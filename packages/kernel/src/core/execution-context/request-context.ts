import type { IRequestContext } from "@veltryx/contracts";

export class KernelRequestContext implements IRequestContext {
  constructor(
    readonly requestId: string,
    readonly correlationId: string,
    readonly source: string | undefined = undefined,
    readonly ip: string | undefined = undefined,
    readonly userAgent: string | undefined = undefined
  ) {
    Object.freeze(this);
  }
}