import { hafasCallStationBoard } from '../src/libs/hafas';

try {
  // void hafasCallStationBoard('6561822');
  void hafasCallStationBoard('7001071');
} catch (error) {
  console.error(error);
  process.exit(1);
}
