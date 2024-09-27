import { hafasDefaultDateTime } from '../defaults/dateTime';
import { hafasBuildDate, hafasBuildTime } from '../builders/dateTime';
import { hafasBuildStationObject } from '../builders/stationObject';
import { hafasBuildApiBody, hafasPauseBeforeRequest, hafasMakeRequest } from '../request/request';
import { hafasParseDateTime } from '../parsers/dateTime';
import { hafasParseDuration } from '../parsers/duration';
import { hafasParseChanges } from '../parsers/changes';
import type { Station } from '../models/station';
import type { Product } from '../models/product';
import type { Trip } from '../models/trip';

export interface TripSearchData {
  trips: Trip[];
  nextPageToken: string | null;
  prevPageToken: string | null;
}

export interface HafasTripSearchResult {
  common: {
    locL: [
      {
        extId: string,
        name: string,
      },
    ],
    prodL: [
      {
        oprX: number,
        prodCtx: {
          catOut: string,
          catOutL: string,
        },
      },
    ],
    opL: [
      {
        name: string,
      },
    ],
  },
  outConL: [
    {
      ctxRecon: string,
      date: string,
      dur: string,
      chg: number,
      dep: {
        locX: number,
        dTimeS: string,
        dTZOffset: number,
        dProdX: number,
      },
      arr: {
        locX: number,
        aTimeS: string,
        aTZOffset: number,
        aProdX: number,
      },
      secL: [
        {
          jny?: {
            dirTxt?: string,
          },
        },
      ],
    },
  ],
  outCtxScrF: string | null,
  outCtxScrB: string | null,
}

const hafasBuildTripSearchBody = (fromId: string, toId: string, dateTime: Date = hafasDefaultDateTime(), limit = 2, pageToken: string | null = null) => (
  hafasBuildApiBody({
    meth: 'TripSearch',
    req: {
      outDate: hafasBuildDate(dateTime),
      outTime: hafasBuildTime(dateTime),
      ctxScr: pageToken,
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
          value: '1023', // Which products = ALL
        },
        {
          type: 'META',
          mode: 'INC',
          meta: 'notBarrierfree', // Accessibility = NO
        },
      ],
      numF: limit, // Number of journeys to return
      getPasslist: false, // Include stopover stations = NO
      getTariff: false, // Include fares = NO
      ushrp: false, // Take additional stations nearby the given start and destination station into account = NO
      getPT: true, // ???
      getIV: false, // Walk/bike as alternatives = NO
      getPolyline: false, // Get journey map data = NO
      outFrwd: true, // ???
      trfReq: {
        jnyCl: 2, // Standard class
        tvlrProf: [
          {
            type: 'E', // Adult
            redtnCard: null, // No railcard
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

const hafasBuildTripSearchData = (result: HafasTripSearchResult): TripSearchData => {
  const stations = result?.common?.locL?.map((station) => ({
    id: station.extId,
    name: station.name,
  } as Station)) ?? [];

  const operators = result?.common?.opL?.map((operator) => (operator.name)) ?? [];

  const products = result?.common?.prodL?.map((product) => ({
    operator: operators[product.oprX as keyof typeof operators],
    category: (product.prodCtx.catOutL !== 'Schnellzug') ? product.prodCtx.catOutL : undefined,
  } as Product)) ?? [];

  return {
    trips: result?.outConL?.map((trip) => ({
      id: trip.ctxRecon,
      from: stations[trip.dep.locX as keyof typeof stations] as Station,
      to: stations[trip.arr.locX as keyof typeof stations] as Station,
      depart: hafasParseDateTime(trip.date, trip.dep.dTimeS, trip.dep.dTZOffset),
      arrive: hafasParseDateTime(trip.date, trip.arr.aTimeS, trip.arr.aTZOffset),
      product: products[trip.dep.dProdX as keyof typeof products] as Product, // TODO: Move to "sectors" array within trip
      direction: trip.secL[0].jny?.dirTxt ?? undefined, // TODO: Move to "sectors" array within trip
      duration: hafasParseDuration(trip.dur),
      changes: hafasParseChanges(trip.chg),
    })) ?? [],
    nextPageToken: result.outCtxScrF ?? null,
    prevPageToken: result.outCtxScrB ?? null,
  };
};

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

    // console.log(JSON.stringify(result, null, 2)); // DEBUG

    const newData = hafasBuildTripSearchData(result);

    data = hafasMergeTripSearchData(data, newData);
    nextPageToken = data.nextPageToken;
    apiCalls += 1;
  }

  console.log(data); // DEBUG

  return data;
};
