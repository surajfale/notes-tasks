const http = require('http');
const dns = require('dns');
const { safeGet, assertAllowedUrl, isBlockedAddress, safeLookup } = require('./safeFetch');

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', '::', 'fd12:3456::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1',
    'not-an-ip',
  ])('blocks %s', (addr) => {
    expect(isBlockedAddress(addr)).toBe(true);
  });

  it.each(['93.184.216.34', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])(
    'allows public %s',
    (addr) => {
      expect(isBlockedAddress(addr)).toBe(false);
    }
  );
});

describe('assertAllowedUrl', () => {
  it.each([
    'file:///etc/passwd',
    'ftp://example.com/',
    'gopher://127.0.0.1:6379/_x',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://2130706433/', // decimal 127.0.0.1, normalised by WHATWG URL
    'http://0x7f.1/',
    'http://169.254.169.254/latest/meta-data/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(() => assertAllowedUrl(url)).toThrow(/non-public/);
  });

  it('accepts public http(s) hostnames (checked again at connect time)', () => {
    expect(assertAllowedUrl('https://example.com/a?b=c').hostname).toBe('example.com');
  });
});

describe('safeLookup', () => {
  afterEach(() => jest.restoreAllMocks());

  const mockDns = (addresses) =>
    jest.spyOn(dns, 'lookup').mockImplementation((host, opts, cb) => cb(null, addresses));

  it('passes through public addresses (single-address shape)', (done) => {
    mockDns([{ address: '93.184.216.34', family: 4 }]);
    safeLookup('example.com', {}, (err, address, family) => {
      expect(err).toBeNull();
      expect(address).toBe('93.184.216.34');
      expect(family).toBe(4);
      done();
    });
  });

  it('passes through public addresses (all: true shape)', (done) => {
    mockDns([{ address: '93.184.216.34', family: 4 }]);
    safeLookup('example.com', { all: true }, (err, addresses) => {
      expect(err).toBeNull();
      expect(addresses).toEqual([{ address: '93.184.216.34', family: 4 }]);
      done();
    });
  });

  it('refuses a name if any resolved address is internal (DNS rebinding / split records)', (done) => {
    mockDns([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    safeLookup('rebind.example', { all: true }, (err) => {
      expect(err.code).toBe('EBLOCKEDADDRESS');
      done();
    });
  });
});

describe('safeGet against a local server', () => {
  let server;
  let port;
  let hits = 0;

  beforeAll((done) => {
    server = http
      .createServer((req, res) => {
        hits += 1;
        res.end('<title>internal admin</title>');
      })
      .listen(0, '127.0.0.1', () => {
        port = server.address().port;
        done();
      });
  });

  afterAll(() => new Promise((resolve) => server.close(() => resolve())));
  beforeEach(() => {
    hits = 0;
  });

  it('refuses a loopback IP literal without connecting', async () => {
    await expect(safeGet(`http://127.0.0.1:${port}/`)).rejects.toMatchObject({ code: 'EBLOCKEDADDRESS' });
    expect(hits).toBe(0);
  });

  it('refuses a hostname that resolves to loopback without connecting', async () => {
    await expect(safeGet(`http://localhost:${port}/`)).rejects.toMatchObject({ code: 'EBLOCKEDADDRESS' });
    expect(hits).toBe(0);
  });
});
