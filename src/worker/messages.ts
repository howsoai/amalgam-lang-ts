export interface MessageEventLike<T = unknown> {
  data: T;
  ports?: ReadonlyArray<MessagePort>;
}

export interface ProtocolMessage {
  type: "request" | "response" | "event" | string;
}

export interface Request extends ProtocolMessage {
  type: "request";
  command: string;
  parameters?: unknown[];
}

export interface Response extends ProtocolMessage {
  type: "response";
  command: string;
  success: boolean;
  body?: unknown;
  error?: Error;
}

export interface Event extends ProtocolMessage {
  type: "event";
  event: string;
  body?: unknown;
}

export function isRequest(message: ProtocolMessage): message is Request {
  return message?.type === "request";
}

export function isResponse(message: ProtocolMessage): message is Response {
  return message?.type === "response";
}

export function isEvent(message: ProtocolMessage): message is Event {
  return message?.type === "event";
}
