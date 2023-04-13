export class AmalgamTrace {
    constructor(enabled) {
        this.enabled = enabled;
    }
    log(...msg) {
        if (this.enabled) {
            console.log(...msg);
        }
    }
    log_time(label) {
        if (this.enabled) {
            const timestamp = new Date();
            this.log(`# TIME ${label} ${timestamp.toISOString()}`);
        }
    }
    log_comment(...comments) {
        if (this.enabled) {
            this.log("#", ...comments);
        }
    }
    log_reply(reply) {
        if (this.enabled) {
            this.log("# REPLY >", JSON.stringify(reply));
        }
    }
    log_command(type, ...parts) {
        if (this.enabled) {
            this.log(type, ...parts.map((p) => String(p)));
        }
    }
}
