import { hafasCall } from '../src/libs/hafas';

try {
  void hafasCall('7100017', '7100127');
} catch (error) {
  console.error(error);
  process.exit(1);
}
