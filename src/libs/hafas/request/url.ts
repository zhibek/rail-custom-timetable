const hafasDirectUrl = (checksum: string) => (`https://reiseauskunft.bahn.de/bin/mgate.exe?checksum=${checksum}`);

const hafasProxyUrl = (checksum: string) => (`https://proxy.cors.sh/${hafasDirectUrl(checksum)}`);

// const hafasProxyUrl = (checksum: string) => (`https://corsproxy.io/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/${hafasDirectUrl(checksum)}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/https://corsproxy.io/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8080/http://localhost:8081/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

// const hafasProxyUrl = (checksum: string) => (`http://localhost:8081/?${encodeURIComponent(hafasDirectUrl(checksum))}`);

export const hafasUrl = (checksum: string, useProxy = true) => (useProxy ? hafasProxyUrl(checksum) : hafasDirectUrl(checksum));
