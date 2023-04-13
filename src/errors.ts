export class AmalgamError extends Error {
  public readonly code?: string;

  constructor(message?: string, code?: string) {
    super(message);
    this.code = code;
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AmalgamError.prototype);
  }

  get detail(): string {
    return this.message;
  }
}

export class AmalgamRuntimeError extends AmalgamError {
  constructor(message?: string, code?: string) {
    super(message, code);
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AmalgamRuntimeError.prototype);
  }
}

export class AmalgamCoreError extends AmalgamError {
  constructor(message?: string, code?: string) {
    super(message, code);
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AmalgamCoreError.prototype);
  }
}
