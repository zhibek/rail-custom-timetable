import fetch from 'cross-fetch';

import { hafasChecksum } from './checksum';
import { hafasUrl } from './url';
import type { HafasTripSearchResult } from '../endpoints/tripSearch';
import type { HafasStationBoardResult } from '../endpoints/stationBoard';

export type HafasResponse = HafasSuccessResponse | HafasErrorResponse;

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

export const PROXY_API_KEY = 'temp_306ab918015b2bc64135f352274fb51c'; // https://cors.sh/

export const PROXY_ORIGIN = 'zhibek.github.io'; // https://cors.sh/

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

export const hafasPauseBeforeRequest = async (attempts: number): Promise<void> => {
  const pauseDuration = (attempts < 3) ? 50 : (attempts < 10) ? 200 : 500;

  return new Promise((resolve) => {
    setTimeout(resolve, pauseDuration);
  });
};

export const hafasMakeRequest = async (body: unknown): Promise<unknown> => {
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

export const hafasBuildApiBody = ({
  meth, req = {}, cfg = {},
}: {
  meth: string;
  req: unknown;
  cfg: unknown;
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
