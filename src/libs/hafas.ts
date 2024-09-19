import md5Hex from 'md5-hex';
import { Buffer } from 'buffer';
import { format as dateFormat, parse as dateParse, add as dateAdd } from 'date-fns';
import fetch from 'cross-fetch';

// //

interface HafasResponse {
  svcResL: [
    {
      res: HafasTripSearchResult | HafasStationBoardResult,
    },
  ]
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
  const pauseBaseDuration = 2;

  const pauseDuration = (pauseBaseDuration ** attempts) * 100; // 1=100ms, 2=200ms, 3=400ms, 4=800ms, 5=1.6sec, 6=3.2sec, 7=6.4sec, 8=12.8, etc

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

interface HafasTripSearchResult {
  outConL?: [
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

export interface Trip {
  index: string,
  arrive: Date,
  depart: Date,
  duration: string,
  changes: number,
}

export interface TripSearchData {
  trips: Trip[],
  nextPageToken: string | null,
  prevPageToken: string | null,
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
  trips: result?.outConL?.map((item) => ({
    index: item.ctxRecon,
    depart: hafasParseDateTime(item.date, item.dep?.dTimeS, item.dep?.dTZOffset),
    arrive: hafasParseDateTime(item.date, item.arr?.aTimeS, item.arr?.aTZOffset),
    duration: hafasParseDuration(item.dur),
    changes: hafasParseChanges(item.chg),
  })) ?? [],
  nextPageToken: result?.outCtxScrF ?? null,
  prevPageToken: result?.outCtxScrB ?? null,
});

export const hafasCallTripSearch = async (fromId: string, toId: string, dateTime: Date = hafasDefaultDateTime(), limit = 10) => {
  console.log('hafasCallTripSearch()');

  const maxApiCalls = 20;

  let data = hafasInitTripSearchData();
  let nextPageToken: string | null = null;
  let apiCalls = 0;

  /* eslint-disable no-await-in-loop */
  while (data.trips.length < limit && apiCalls < maxApiCalls) {
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
  common?: {
    locL?: [
      {
        extId: string,
        name: string,
      },
    ],
  },
}

export interface Station {
  id: string,
  name: string,
}

export interface StationBoardData {
  stations: Station[],
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
      getPasslist: true,
      stbFltrEquiv: false,
    },
    cfg: {
      rtMode: 'HYBRID',
    },
  })
);

const hafasBuildStationBoardData = (result: HafasStationBoardResult): StationBoardData => ({
  stations: result?.common?.locL?.map((item) => ({
    id: item.extId,
    name: item.name,
  })) ?? [],
});

export const hafasCallStationBoard = async (stationId: string, type = 'DEP' as const, dateTime: Date = hafasDefaultDateTime()) => {
  console.log('hafasCallStationBoard()');

  const body = hafasBuildStationBoardBody(stationId, type, dateTime);

  const result = await hafasMakeRequest(body) as HafasStationBoardResult;

  // console.log(JSON.stringify(result)); // DEBUG

  const data = hafasBuildStationBoardData(result);

  console.log(data); // DEBUG

  return data;
};
