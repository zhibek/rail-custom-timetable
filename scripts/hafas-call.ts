import { hafasCallTripSearch } from '../src/libs/hafas';

try {
  // void hafasCallTripSearch('7100017', '7100127');
  void hafasCallTripSearch('7001071', '7002889');
} catch (error) {
  console.error(error);
  process.exit(1);
}
