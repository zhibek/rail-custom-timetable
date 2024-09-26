import { parse as dateParse, add as dateAdd } from 'date-fns';

export const hafasParseDateTime = (date: string, time: string, tzOffset: number): Date => {
  const timeParts = time.match(/.{2}/g);

  const timeFormatted = (timeParts?.length === 3) ? `${timeParts[0]}:${timeParts[1]}`
    : (timeParts?.length === 4) ? `${timeParts[1]}:${timeParts[2]}` // 4 date parts indicates next day (01003000 = 00:30 +1 day)
      : null;

  let dateTime = dateParse(`${date} ${timeFormatted} Z`, 'yyyyMMdd HH:mm X', new Date());

  if (tzOffset !== 0) {
    dateTime = dateAdd(dateTime, {
      minutes: (0 - tzOffset),
    });
  }

  if (timeParts?.length === 4) {
    dateTime = dateAdd(dateTime, {
      days: 1,
    });
  }

  return dateTime;
};
