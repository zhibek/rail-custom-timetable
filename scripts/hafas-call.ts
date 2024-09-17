import { hafasCall } from '../src/libs/hafas';

try {
  // void hafasCall('7100017', '7100127');
  void hafasCall('7001071', '7002889');
} catch (error) {
  console.error(error);
  process.exit(1);
}
