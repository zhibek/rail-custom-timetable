/* eslint-disable-next-line import/no-extraneous-dependencies */
import fetchTrainlineStations, { collect } from 'trainline-stations';

interface TrainlineStation {
  db_id: string,
  name: string,
  is_suggestable: boolean,
  is_city: boolean,
  is_main_station: boolean,
  country: string,
  time_zone: string,
  longitude: string,
  latitude: string,
}

const generateData = async () => {
  console.error('Fetching latest stations list from trainline-eu shared data...');

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-call */
  const rawData = await collect(fetchTrainlineStations()) as TrainlineStation[];

  const filteredData = rawData
    .filter((station) => (station.is_suggestable && !!station.db_id))
    .map((station) => ({
      id: station.db_id,
      name: station.name,
      country: station.country,
      // isCity: station.is_city,
      // isMain: station.is_main_station,
      // timezone: station.time_zone,
      // location: {
      //   longitude: +station.longitude,
      //   latitude: +station.latitude,
      // },
    }));

  const uniqueMap = new Map();
  filteredData.forEach((station) => {
    if (!uniqueMap.get(station.name)) {
      uniqueMap.set(station.name, station);
    }
  });
  const sortedMap = new Map([...uniqueMap.entries()].sort());
  const sortedData = [...sortedMap.values()];

  process.stdout.write(JSON.stringify(sortedData));

  console.error(`Data generation complete! raw-count=${rawData.length} filtered-count=${filteredData.length} unique-count=${sortedData.length}`);
};

try {
  void generateData();
} catch (error) {
  console.error(error);
  process.exit(1);
}
