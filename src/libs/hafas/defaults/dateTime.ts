import { add as dateAdd } from 'date-fns';

export const hafasDefaultDateTime = (): Date => (
  dateAdd(new Date(), {
    hours: 1,
  })
);
