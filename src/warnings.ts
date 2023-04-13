export class AmalgamWarning {
  constructor(public readonly detail: string = "", public readonly code?: string) {}

  get message(): string {
    return this.detail;
  }
}

export class AmalgamCoreWarning extends AmalgamWarning {}
