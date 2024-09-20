import { useState } from 'react';

import StationSelect from './StationSelect';
import TripSearchResult from './TripSearchResult';

function TripSearch() {
  const [fromStation, setFromStation] = useState<string | null>();
  const [toStation, setToStation] = useState<string | null>();

  return (
    <>
      <StationSelect
        id="from"
        label="From"
        setValue={(newStationId: string | null) => setFromStation(newStationId)}
      />

      <StationSelect
        id="to"
        label="To"
        setValue={(newStationId: string | null) => setToStation(newStationId)}
      />

      <TripSearchResult
        fromStation={fromStation}
        toStation={toStation}
      />
    </>
  );
}

export default TripSearch;
