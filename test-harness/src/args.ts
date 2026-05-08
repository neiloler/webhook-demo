export const hasFlag = (args: string[], name: string): boolean => {
  const flag = name.startsWith("--") ? name : `--${name}`;
  return args.includes(flag);
};

export const getStringOption = (
  args: string[],
  name: string,
  fallback: string,
): string => {
  const flag = name.startsWith("--") ? name : `--${name}`;
  const equalsPrefix = `${flag}=`;
  const equalsMatch = args.find((arg) => arg.startsWith(equalsPrefix));

  if (equalsMatch) {
    return equalsMatch.slice(equalsPrefix.length);
  }

  const index = args.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : fallback;
};

export const getOptionalStringOption = (
  args: string[],
  name: string,
): string | null => {
  const sentinel = "\0__missing__";
  const value = getStringOption(args, name, sentinel);
  return value === sentinel ? null : value;
};

export const getNumberOption = (
  args: string[],
  name: string,
  fallback: number,
): number => {
  const value = getStringOption(args, name, String(fallback));
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected --${name.replace(/^--/, "")} to be a number.`);
  }

  return parsed;
};

export const getIntegerOption = (
  args: string[],
  name: string,
  fallback: number,
): number => {
  const parsed = getNumberOption(args, name, fallback);

  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected --${name.replace(/^--/, "")} to be an integer.`);
  }

  return parsed;
};
