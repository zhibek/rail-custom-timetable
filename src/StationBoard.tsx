import { useState } from 'react';

import StationSelect from './StationSelect';
import StationBoardResult from './StationBoardResult';

function TripSearch() {
  const [station, setStation] = useState<string | null>();

  return (
    <>
      <StationSelect
        id="station"
        label="Station"
        setValue={(newStationId: string | null) => setStation(newStationId)}
      />

      <StationBoardResult
        station={station}
      />
    </>
  );
}

export default TripSearch;
