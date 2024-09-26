import { hafasDefaultDateTime } from '../defaults/dateTime';
import { hafasBuildDate, hafasBuildTime } from '../builders/dateTime';
import { hafasBuildStationObject } from '../builders/stationObject';
import { hafasBuildApiBody, hafasMakeRequest } from '../request/request';
import { hafasParseDateTime } from '../parsers/dateTime';
import type { Station } from '../models/station';
import type { Trip } from '../models/trip';

export interface StationBoardData {
  stations: Station[];
  trips: Trip[];
}

export interface HafasStationBoardResult {
  common: {
    locL: [
      {
        extId: string,
        name: string,
      },
    ],
  },
  jnyL: [
    {
      jid: string,
      dirTxt: string,
      date: string,
      stbStop: {
        aTimeS?: string,
        aTZOffset?: number,
        dTimeS?: string,
        dTZOffset?: number,
      },
      stopL: [
        {
          locX: string,
          aTimeS?: string,
          aTZOffset?: number,
          dTimeS?: string,
          dTZOffset?: number,
        },
      ],
    },
  ],
}

const hafasBuildStationBoardBody = (stationId: string, type: 'DEP' | 'ARR' = 'DEP', dateTime: Date = hafasDefaultDateTime(), duration = 60) => (
  hafasBuildApiBody({
    meth: 'StationBoard',
    req: {
      type,
      date: hafasBuildDate(dateTime),
      time: hafasBuildTime(dateTime),
      dur: duration,
      stbLoc: hafasBuildStationObject(stationId),
      dirLoc: null,
      jnyFltrL: [
        {
          type: 'PROD',
          mode: 'INC',
          value: '31',
        },
      ],
      getPasslist: true, // Newer HAFAS protocol versions don't support this flag - need to call 'JourneyDetails' (trip) for each journey instead
      stbFltrEquiv: false, // Newer HAFAS protocol versions don't support this flag - need to call 'JourneyDetails' (trip) for each journey instead
    },
    cfg: {
      rtMode: 'HYBRID',
    },
  })
);

const hafasBuildStationBoardData = (result: HafasStationBoardResult): StationBoardData => {
  const stations = result?.common?.locL?.map((station) => ({
    id: station.extId,
    name: station.name,
  })) ?? [];

  const trips = result?.jnyL?.map((trip) => ({
    id: trip.jid,
    direction: trip.dirTxt,
    arrive: (trip.stbStop?.aTimeS && trip.stbStop?.aTZOffset) ? hafasParseDateTime(trip.date, trip.stbStop.aTimeS, trip.stbStop.aTZOffset) : null,
    depart: (trip.stbStop?.dTimeS && trip.stbStop?.dTZOffset) ? hafasParseDateTime(trip.date, trip.stbStop.dTimeS, trip.stbStop.dTZOffset) : null,
    stops: trip?.stopL?.map((stop) => ({
      station: (stations[parseInt(stop.locX, 10) as keyof typeof stations] as Station) ?? null,
      arrive: (stop?.aTimeS && stop?.aTZOffset) ? hafasParseDateTime(trip.date, stop.aTimeS, stop.aTZOffset) : null,
      depart: (stop?.dTimeS && stop?.dTZOffset) ? hafasParseDateTime(trip.date, stop.dTimeS, stop.dTZOffset) : null,
    })) ?? [],
  })) ?? [];

  return {
    stations,
    trips,
  };
};

export const hafasCallStationBoard = async (stationId: string, type = 'DEP' as const, dateTime: Date = hafasDefaultDateTime(), duration = 60) => {
  console.log('hafasCallStationBoard()');

  const body = hafasBuildStationBoardBody(stationId, type, dateTime, duration);

  const result = await hafasMakeRequest(body) as HafasStationBoardResult;

  // console.log(JSON.stringify(result)); // DEBUG
  const data = hafasBuildStationBoardData(result);

  console.log(data); // DEBUG

  return data;
};
