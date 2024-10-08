export type Args = (...args: any[]) => void;

export type Logger = {
  error: Args;
  warn: Args;
  info: Args;
  debug: Args;
};

export const nullLogger: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
