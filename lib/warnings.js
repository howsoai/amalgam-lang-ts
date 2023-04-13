export class AmalgamWarning {
    constructor(detail = "", code) {
        this.detail = detail;
        this.code = code;
    }
    get message() {
        return this.detail;
    }
}
export class AmalgamCoreWarning extends AmalgamWarning {
}
