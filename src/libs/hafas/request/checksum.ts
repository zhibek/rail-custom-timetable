import { Buffer } from 'buffer';
import md5Hex from 'md5-hex';

const SALT: Buffer = Buffer.from(JSON.parse('{ "type": "Buffer", "data": [98,100,73,56,85,86,106,52,48,75,53,102,118,120,119,102]}') as WithImplicitCoercion<ArrayBuffer>);

export const hafasChecksum = (body: unknown, salt = SALT) => (
  md5Hex(Buffer.concat([
    Buffer.from(JSON.stringify(body), 'utf8'),
    salt,
  ]))
);
