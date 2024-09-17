import { useState, useEffect } from 'react';

import { hafasCall, Journey } from './libs/hafas';

import LayoutFrame from './LayoutFrame';
import StationSelect from './StationSelect';

function App() {
  const [fromStation, setFromStation] = useState<string | null>();
  const [toStation, setToStation] = useState<string | null>();
  const [journeys, setJourneys] = useState<Journey[]>();

  useEffect(() => {
    async function doHafasCall() {
      if (!fromStation || !toStation) {
        return;
      }
      console.log(`fromStation="${fromStation}" toStation="${toStation}"`);

      setJourneys([]);

      const newJourneys = await hafasCall(fromStation, toStation);
      console.log(newJourneys);
      if (newJourneys) {
        setJourneys(newJourneys);
      }
    }

    void doHafasCall();
  }, [fromStation, toStation]);

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

      <ul>
        {(journeys)?.map((journey) => (
          <li key={journey?.depart ?? '-'}>
            {journey?.depart ?? '-'}
            {' - '}
            {journey?.arrive ?? '-'}
          </li>
        ))}
      </ul>

    </LayoutFrame>
  );
}

export default App;
