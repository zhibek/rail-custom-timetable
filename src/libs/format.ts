import { format as dateFormat } from 'date-fns';

export const formatDateTime = (dateTime: Date): string => (
  dateFormat(dateTime, 'yyyy-MM-dd HH:mm')
);
