export class AmalgamError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, AmalgamError.prototype);
    }
    get detail() {
        return this.message;
    }
}
export class AmalgamRuntimeError extends AmalgamError {
    constructor(message, code) {
        super(message, code);
        Object.setPrototypeOf(this, AmalgamRuntimeError.prototype);
    }
}
export class AmalgamCoreError extends AmalgamError {
    constructor(message, code) {
        super(message, code);
        Object.setPrototypeOf(this, AmalgamCoreError.prototype);
    }
}
