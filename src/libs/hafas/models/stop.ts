import { Station } from './station';

export interface Stop {
  station: Station | null;
  arrive: Date | null;
  depart: Date | null;
}
