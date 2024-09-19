import md5Hex from 'md5-hex';
import { Buffer } from 'buffer';
import { format as dateFormat, parse as dateParse, add as dateAdd } from 'date-fns';
import fetch from 'cross-fetch';

interface HafasTripSearchResponse {
  svcResL?: [
    {
      res?: {
        outConL?: [
          {
            cid: string,
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
      },
    },
  ]
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
    // days: 1,
    minutes: 40,
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

export const hafasMakeRequest = async (body: unknown): Promise<unknown> => {
  const checksum = hafasChecksum(body);

  const url = hafasUrl(checksum);

  const request = hafasRequest(body, checksum);

  const response = await fetch(url, request);

  const result = await response.json() as unknown;

  return result;
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

const hafasBuildTripSearchBody = (fromId: string, toId: string, dateTime: Date = hafasDefaultDateTime(), limit = 10, pageToken: string | null = null) => ({
  lang: 'en',
  svcReqL: [
    {
      cfg: {
        polyEnc: 'GPA',
        rtMode: 'HYBRID',
      },
      meth: 'TripSearch',
      req: {
        outDate: dateFormat(dateTime, 'yyyyMMdd'),
        outTime: dateFormat(dateTime, 'HHmmss'),
        ctxScr: pageToken,
        getPasslist: false,
        maxChg: 0,
        minChgTime: 0,
        depLocL: [
          {
            type: 'S',
            lid: `A=1@L=${fromId}@`,
          },
        ],
        viaLocL: null,
        arrLocL: [
          {
            type: 'S',
            lid: `A=1@L=${toId}@`,
          },
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

const hafasParseTripSearchResponse = (response: HafasTripSearchResponse): TripSearchData => {
  // console.log('hafasParseTripSearchResponse()');

  const data = response?.svcResL?.[0]?.res;
  // console.log(JSON.stringify(data, null, 2));

  return {
    trips: data?.outConL?.map((item) => ({
      index: item.cid,
      depart: hafasParseDateTime(item.date, item.dep?.dTimeS, item.dep?.dTZOffset),
      arrive: hafasParseDateTime(item.date, item.arr?.aTimeS, item.arr?.aTZOffset),
      duration: hafasParseDuration(item.dur),
      changes: hafasParseChanges(item.chg),
    })) ?? [],
    nextPageToken: data?.outCtxScrF ?? null,
    prevPageToken: data?.outCtxScrB ?? null,
  };
};

export const hafasCallTripSearch = async (fromId: string, toId: string) => {
  console.log('init hafasCallTripSearch()');

  const body = hafasBuildTripSearchBody(fromId, toId);

  const result = await hafasMakeRequest(body) as HafasTripSearchResponse;

  const data = hafasParseTripSearchResponse(result);
  console.log(data); // DEBUG

  return data;
};
