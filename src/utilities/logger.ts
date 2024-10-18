export type Args = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => void;

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
