import { useState } from 'react';

import LayoutFrame from './LayoutFrame';
import StationSelect from './StationSelect';

function App() {
  const [fromStation, setFromStation] = useState<string | null>();
  const [toStation, setToStation] = useState<string | null>();

  return (
    <LayoutFrame>

      <h1>Rail Custom Timetable</h1>

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

      <p>
        fromStation:
        {fromStation}
      </p>

      <p>
        toStation:
        {toStation}
      </p>

    </LayoutFrame>
  );
}

export default App;
