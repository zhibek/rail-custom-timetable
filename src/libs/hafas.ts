import md5Hex from 'md5-hex';
import { Buffer } from 'buffer';

interface HafasResponse {
  svcResL?: [
    {
      res?: {
        outConL?: [
          {
            dep: {
              dTimeS: string,
            },
            arr: {
              aTimeS: string,
            },
          },
        ]
      },
    },
  ]
}

const SALT: Buffer = Buffer.from(JSON.parse('{ "type": "Buffer", "data": [98,100,73,56,85,86,106,52,48,75,53,102,118,120,119,102]}') as WithImplicitCoercion<ArrayBuffer>);

const hafasChecksum = (body: unknown, salt = SALT) => (
  md5Hex(Buffer.concat([
    Buffer.from(JSON.stringify(body), 'utf8'),
    salt,
  ]))
);

const hafasBody = (fromId: string, toId: string) => ({
  lang: 'en',
  svcReqL: [
    {
      cfg: {
        polyEnc: 'GPA',
        rtMode: 'HYBRID',
      },
      meth: 'TripSearch',
      req: {
        outDate: '20240924',
        outTime: '000000',
        ctxScr: null,
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
        numF: 3,
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

const hafasDirectUrl = (checksum: string) => (`https://reiseauskunft.bahn.de/bin/mgate.exe?checksum=${checksum}`);

const hafasProxyUrl = (checksum: string) => (`https://corsproxy.io/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

const hafasUrl = (checksum: string, useProxy = true) => (useProxy ? hafasProxyUrl(checksum) : hafasDirectUrl(checksum));

const hafasRequest = (body: unknown, checksum: string) => ({
  method: 'post',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, br, deflate',
    Accept: 'application/json',
    'user-agent': 'die33490c2dd86rekt.bahn.guru',
  },
  redirect: 'follow' as const,
  query: {
    checksum,
  },
});

const hafasParseTime = (time: string) => (
  [time.match(/.{2}/g)]
    .map(
      (timeParts) => (
        (timeParts?.length === 3) ? `${timeParts[0]}:${timeParts[1]}` : null
      ),
    )
);

const hafasParseResponse = (response: HafasResponse) => (
  response?.svcResL?.[0]?.res?.outConL?.map((item) => ({
    depart: hafasParseTime(item?.dep?.dTimeS),
    arrive: hafasParseTime(item?.arr?.aTimeS),
  }))
);

export const hafasCall = async (fromId = '7100017', toId = '7100127') => {
  console.log('init hafasCall()');

  const body = hafasBody(fromId, toId);
  const checksum = hafasChecksum(body);
  console.log(`checksum: ${checksum}`);
  const url = hafasUrl(checksum);
  const request = hafasRequest(body, checksum);

  const response = await fetch(url, request);
  const json = await response.json() as HafasResponse;
  const data = hafasParseResponse(json);

  console.log(data);

  return data;
};
