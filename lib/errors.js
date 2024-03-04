export class AmalgamError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = "AmalgamError";
    }
    get detail() {
        return this.message;
    }
    serialize() {
        return { detail: this.detail, code: this.code, name: this.name };
    }
}
export class AmalgamRuntimeError extends AmalgamError {
    constructor(message, code) {
        super(message, code);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = "AmalgamRuntimeError";
    }
}
