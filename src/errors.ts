export class AmalgamError extends Error {
  public readonly code?: string;

  constructor(message?: string, code?: string) {
    super(message);
    this.code = code;
    // Set the prototype explicitly
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "AmalgamError";
  }

  get detail(): string {
    return this.message;
  }

  serialize() {
    return { detail: this.detail, code: this.code, name: this.name };
  }
}

export class AmalgamRuntimeError extends AmalgamError {
  constructor(message?: string, code?: string) {
    super(message, code);
    // Set the prototype explicitly
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "AmalgamRuntimeError";
  }
}
