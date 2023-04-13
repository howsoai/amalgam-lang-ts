export function isRequest(message) {
    return (message === null || message === void 0 ? void 0 : message.type) === "request";
}
export function isResponse(message) {
    return (message === null || message === void 0 ? void 0 : message.type) === "response";
}
export function isEvent(message) {
    return (message === null || message === void 0 ? void 0 : message.type) === "event";
}
