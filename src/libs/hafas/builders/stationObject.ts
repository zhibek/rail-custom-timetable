export const hafasBuildStationObject = (stationId: string) => ({
  type: 'S',
  lid: `A=1@L=${stationId}@`,
});
