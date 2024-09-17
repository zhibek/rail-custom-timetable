import stationsData from './data/stations.json';

if (stationsData?.length <= 1) {
  console.warn('Stations data needs to be generated using "npm run generate-data"!');
}

function TemporaryDataCheck() {
  return (
    <>
      <h2>Temporary Data Check</h2>
      <p>
        Count:
        {' '}
        {stationsData?.length ?? 'Not found'}
      </p>
    </>
  );
}

export default TemporaryDataCheck;
