import { Station } from './station';
import { Product } from './product';
import { Stop } from './stop';

export interface Trip {
  id: string,
  from?: Station | null,
  to?: Station | null,
  arrive: Date | null,
  depart: Date | null,
  product?: Product,
  duration?: string,
  changes?: number,
  direction?: string,
  stops?: Stop[],
}
