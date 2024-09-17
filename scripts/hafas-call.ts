import { hafasCall } from '../src/libs/hafas';

try {
  void hafasCall();
} catch (error) {
  console.error(error);
  process.exit(1);
}
