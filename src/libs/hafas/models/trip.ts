import { Stop } from './stop';

export interface Trip {
  id: string;
  arrive: Date | null;
  depart: Date | null;
  duration?: string;
  changes?: number;
  direction?: string;
  stops?: Stop[];
}
