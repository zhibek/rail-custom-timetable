export const hafasParseDuration = (duration: string): string => {
  const durationParts = duration.match(/.{2}/g) ?? [];

  durationParts.pop(); // remove seconds

  const durationFormatted = durationParts.join(':') ?? '';

  return durationFormatted;
};
