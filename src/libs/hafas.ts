import md5Hex from 'md5-hex';
import { Buffer } from 'buffer';
import { format as dateFormat, parse as dateParse, add as dateAdd } from 'date-fns';
import fetch from 'cross-fetch';

// //

type HafasResponse = HafasSuccessResponse | HafasErrorResponse;

interface HafasSuccessResponse {
  svcResL: [
    {
      res: HafasTripSearchResult | HafasStationBoardResult,
    },
  ]
}

interface HafasErrorResponse {
  errTxt: string,
}

const SALT: Buffer = Buffer.from(JSON.parse('{ "type": "Buffer", "data": [98,100,73,56,85,86,106,52,48,75,53,102,118,120,119,102]}') as WithImplicitCoercion<ArrayBuffer>);

const PROXY_API_KEY = 'temp_306ab918015b2bc64135f352274fb51c'; // https://cors.sh/

const PROXY_ORIGIN = 'zhibek.github.io'; // https://cors.sh/

const hafasChecksum = (body: unknown, salt = SALT) => (
  md5Hex(Buffer.concat([
    Buffer.from(JSON.stringify(body), 'utf8'),
    salt,
  ]))
);

const hafasDefaultDateTime = (): Date => (
  dateAdd(new Date(), {
    hours: 1,
  })
);

const hafasDirectUrl = (checksum: string) => (`https://reiseauskunft.bahn.de/bin/mgate.exe?checksum=${checksum}`);

const hafasProxyUrl = (checksum: string) => (`https://proxy.cors.sh/${hafasDirectUrl(checksum)}`);

// const hafasProxyUrl = (checksum: string) => (`https://corsproxy.io/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/${hafasDirectUrl(checksum)}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/https://corsproxy.io/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/http://localhost:8081/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8081/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

const hafasUrl = (checksum: string, useProxy = true) => (useProxy ? hafasProxyUrl(checksum) : hafasDirectUrl(checksum));

const hafasBuildApiBody = ({
  meth,
  req = {},
  cfg = {},
} : {
  meth: string,
  req: unknown,
  cfg: unknown,
}) => ({
  lang: 'en',
  svcReqL: [
    {
      meth, // 'TripSearch'
      req,
      cfg,
    },
  ],
  client: {
    id: 'DB',
    v: '16040000',
    type: 'IPH',
    name: 'DB Navigator',
  },
  ext: 'DB.R19.04.a',
  ver: '1.16',
  // client: {
  //   type: 'AND',
  //   id: 'DB',
  //   v: 21120000,
  //   name: 'DB Navigator',
  // },
  // ext: 'DB.R21.12.a',
  // ver: '1.34',
  auth: {
    type: 'AID',
    aid: 'n91dB8Z77MLdoR0K',
  },
});

const hafasBuildStationObject = (stationId: string) => ({
  type: 'S',
  lid: `A=1@L=${stationId}@`,
});

const hafasRequest = (body: unknown, checksum: string) => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'die33490c2dd86rekt.bahn.guru',
    'x-cors-api-key': PROXY_API_KEY,
    origin: PROXY_ORIGIN,
  },
  redirect: 'follow' as const,
  query: {
    checksum,
  },
});

const hafasPauseBeforeRequest = async (attempts: number): Promise<void> => {
  const pauseDuration = (attempts < 3) ? 50 : (attempts < 10) ? 200 : 500;

  return new Promise((resolve) => {
    setTimeout(resolve, pauseDuration);
  });
};

const hafasMakeRequest = async (body: unknown): Promise<unknown> => {
  console.log('hafasMakeRequest()');

  const checksum = hafasChecksum(body);

  const url = hafasUrl(checksum);

  const request = hafasRequest(body, checksum);

  const response = await fetch(url, request);

  const json = await response.json() as HafasResponse;

  // console.log(JSON.stringify(json)); // DEBUG

  if ('errTxt' in json) {
    throw new Error(`Hafas API Error: ${json.errTxt}`);
  }

  const data = json.svcResL[0].res;

  return data;
};

const hafasParseDateTime = (date: string, time: string, tzOffset: number): Date => {
  const timeParts = time.match(/.{2}/g);

  const timeFormatted = (timeParts?.length === 3) ? `${timeParts[0]}:${timeParts[1]}`
    : (timeParts?.length === 4) ? `${timeParts[1]}:${timeParts[2]}` // 4 date parts indicates next day (01003000 = 00:30 +1 day)
      : null;

  let dateTime = dateParse(`${date} ${timeFormatted} Z`, 'yyyyMMdd HH:mm X', new Date());

  if (tzOffset !== 0) {
    dateTime = dateAdd(dateTime, {
      minutes: (0 - tzOffset),
    });
  }

  if (timeParts?.length === 4) {
    dateTime = dateAdd(dateTime, {
      days: 1,
    });
  }

  return dateTime;
};

const hafasParseDuration = (duration: string): string => {
  const durationParts = duration.match(/.{2}/g) ?? [];

  durationParts.pop(); // remove seconds

  const durationFormatted = durationParts.join(':') ?? '';

  return durationFormatted;
};

const hafasParseChanges = (changes: number): number => (
  changes ?? -1
);

// //

export interface Station {
  id: string,
  name: string,
}

export interface Stop {
  station: Station | null,
  arrive: Date | null,
  depart: Date | null,
}

export interface Trip {
  id: string,
  arrive: Date | null,
  depart: Date | null,
  duration?: string,
  changes?: number,
  direction?: string,
  stops?: Stop[],
}

export interface TripSearchData {
  trips: Trip[],
  nextPageToken: string | null,
  prevPageToken: string | null,
}

export interface StationBoardData {
  stations: Station[],
  trips: Trip[],
}

// //

interface HafasTripSearchResult {
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
      outDate: dateFormat(dateTime, 'yyyyMMdd'),
      outTime: dateFormat(dateTime, 'HHmmss'),
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

// //

interface HafasStationBoardResult {
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
  ]
}

const hafasBuildStationBoardBody = (stationId: string, type: 'DEP' | 'ARR' = 'DEP', dateTime: Date = hafasDefaultDateTime(), duration = 60) => (
  hafasBuildApiBody({
    meth: 'StationBoard',
    req: {
      type,
      date: dateFormat(dateTime, 'yyyyMMdd'),
      time: dateFormat(dateTime, 'HHmmss'),
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
