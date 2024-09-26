import { hafasDefaultDateTime } from '../defaults/dateTime';
import { hafasBuildDate, hafasBuildTime } from '../builders/dateTime';
import { hafasBuildStationObject } from '../builders/stationObject';
import { hafasBuildApiBody, hafasPauseBeforeRequest, hafasMakeRequest } from '../request/request';
import { hafasParseDateTime } from '../parsers/dateTime';
import { hafasParseDuration } from '../parsers/duration';
import { hafasParseChanges } from '../parsers/changes';
import type { Trip } from '../models/trip';

export interface TripSearchData {
  trips: Trip[];
  nextPageToken: string | null;
  prevPageToken: string | null;
}

export interface HafasTripSearchResult {
  outConL: [
    {
      ctxRecon: string,
      date: string,
      dur: string,
      chg: number,
      dep: {
        dTimeS: string,
        dTZOffset: number,
      },
      arr: {
        aTimeS: string,
        aTZOffset: number,
      },
    },
  ],
  outCtxScrF: string | null,
  outCtxScrB: string | null,
}

const hafasBuildTripSearchBody = (fromId: string, toId: string, dateTime: Date = hafasDefaultDateTime(), limit = 10, pageToken: string | null = null) => (
  hafasBuildApiBody({
    meth: 'TripSearch',
    req: {
      outDate: hafasBuildDate(dateTime),
      outTime: hafasBuildTime(dateTime),
      ctxScr: pageToken,
      getPasslist: false,
      maxChg: 0,
      minChgTime: 0,
      depLocL: [
        hafasBuildStationObject(fromId),
      ],
      viaLocL: null,
      arrLocL: [
        hafasBuildStationObject(toId),
      ],
      jnyFltrL: [
        {
          type: 'PROD',
          mode: 'INC',
          value: '1023',
        },
        {
          type: 'META',
          mode: 'INC',
          meta: 'notBarrierfree',
        },
      ],
      getTariff: false,
      ushrp: true,
      getPT: true,
      getIV: false,
      getPolyline: false,
      numF: limit,
      outFrwd: true,
      trfReq: {
        jnyCl: 2,
        tvlrProf: [
          {
            type: 'E',
            redtnCard: null,
          },
        ],
        cType: 'PK',
      },
    },
    cfg: {
      polyEnc: 'GPA',
      rtMode: 'HYBRID',
    },
  })
);

const hafasInitTripSearchData = (): TripSearchData => ({
  trips: [],
  nextPageToken: null,
  prevPageToken: null,
});

const hafasMergeTripSearchData = (existingData: TripSearchData, newData: TripSearchData): TripSearchData => ({
  trips: existingData.trips.concat(newData.trips),
  nextPageToken: newData.nextPageToken,
  prevPageToken: newData.prevPageToken,
});

const hafasBuildTripSearchData = (result: HafasTripSearchResult): TripSearchData => ({
  trips: result?.outConL?.map((trip) => ({
    id: trip.ctxRecon,
    depart: hafasParseDateTime(trip.date, trip.dep.dTimeS, trip.dep.dTZOffset),
    arrive: hafasParseDateTime(trip.date, trip.arr.aTimeS, trip.arr.aTZOffset),
    duration: hafasParseDuration(trip.dur),
    changes: hafasParseChanges(trip.chg),
  })) ?? [],
  nextPageToken: result.outCtxScrF ?? null,
  prevPageToken: result.outCtxScrB ?? null,
});

export const hafasCallTripSearch = async (fromId: string, toId: string, dateTime: Date = hafasDefaultDateTime(), limit = 10) => {
  console.log('hafasCallTripSearch()');

  const maxApiCalls = 20;
  const maxEmptyApiCalls = 3;

  let data = hafasInitTripSearchData();
  let nextPageToken: string | null = null;
  let apiCalls = 0;

  /* eslint-disable no-await-in-loop */
  while ((data.trips.length < limit) && (apiCalls < maxApiCalls) && (data.trips.length >= 1 || apiCalls < maxEmptyApiCalls)) {
    const body = hafasBuildTripSearchBody(fromId, toId, dateTime, limit, nextPageToken);

    await hafasPauseBeforeRequest(apiCalls);

    const result = await hafasMakeRequest(body) as HafasTripSearchResult;

    // console.log(JSON.stringify(result)); // DEBUG
    const newData = hafasBuildTripSearchData(result);

    data = hafasMergeTripSearchData(data, newData);
    nextPageToken = data.nextPageToken;
    apiCalls += 1;
  }

  console.log(data); // DEBUG

  return data;
};
