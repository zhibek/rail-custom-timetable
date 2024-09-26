import { format as dateFormat } from 'date-fns';

export const hafasBuildDate = (dateTime: Date) => (
  dateFormat(dateTime, 'yyyyMMdd')
);

export const hafasBuildTime = (dateTime: Date) => (
  dateFormat(dateTime, 'HHmmss')
);
