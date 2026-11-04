/**
 * Outbound HTTP for user-supplied URLs (link previews), with SSRF guards.
 *
 * A user can make the server fetch any URL they type, so the request must
 * never reach loopback, private networks, link-local / cloud-metadata
 * addresses, or anything else that isn't the public internet. Two layers:
 *
 *   1. assertAllowedUrl() — http(s) only, and literal-IP hosts are checked
 *      against the block list. Run on the initial URL and on every redirect
 *      hop (literal IPs never go through DNS, so the agent can't see them).
 *   2. safeLookup() on the http/https agents — every hostname is resolved
 *      by us and the connection is refused if ANY resolved address is
 *      blocked. Because the check happens at connect time on the address
 *      actually used, DNS rebinding between "check" and "connect" can't
 *      slip through.
 */

const net = require('net');
const dns = require('dns');
const http = require('http');
const https = require('https');
const axios = require('axios');

const blockList = new net.BlockList();
[
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT (also used by some PaaS internal networks)
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata (169.254.169.254)
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
].forEach(([addr, prefix]) => blockList.addSubnet(addr, prefix, 'ipv4'));
[
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['64:ff9b::', 96], // NAT64 (can map to internal v4)
  ['100::', 64], // discard
  ['2001:db8::', 32], // documentation
  ['fc00::', 7], // unique local (Railway private networking lives here)
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
].forEach(([addr, prefix]) => blockList.addSubnet(addr, prefix, 'ipv6'));

/**
 * @param {string} address - IP literal
 * @returns {boolean} true if the address must not be contacted (or isn't an IP at all)
 */
function isBlockedAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return blockList.check(address, 'ipv4');
  if (family === 6) {
    // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible forms: judge the v4 part.
    const mapped = address.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return blockList.check(mapped[1], 'ipv4');
    return blockList.check(address, 'ipv6');
  }
  return true;
}

function blockedError(target) {
  const err = new Error(`Refusing to fetch non-public address: ${target}`);
  err.code = 'EBLOCKEDADDRESS';
  return err;
}

/**
 * dns.lookup-compatible resolver that refuses blocked addresses.
 * Handles both the single-address and `all: true` call shapes Node uses.
 */
function safeLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (typeof options === 'number') {
    options = { family: options };
  }

  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses.length) return callback(blockedError(hostname));

    const blocked = addresses.find((a) => isBlockedAddress(a.address));
    if (blocked) return callback(blockedError(`${hostname} (${blocked.address})`));

    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
}

/**
 * Throws unless the URL is http(s) and, when its host is an IP literal,
 * that IP is public. Hostnames are checked later, at connect time.
 * @param {string} rawUrl
 * @returns {URL}
 */
function assertAllowedUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw blockedError(String(rawUrl));
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw blockedError(url.protocol);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isBlockedAddress(host)) {
    throw blockedError(host);
  }
  return url;
}

const httpAgent = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

/**
 * GET a user-supplied URL with SSRF protection.
 * @param {string} rawUrl
 * @param {import('axios').AxiosRequestConfig} [config] - timeout, headers, etc.
 */
async function safeGet(rawUrl, config = {}) {
  assertAllowedUrl(rawUrl);
  return axios.get(rawUrl, {
    ...config,
    httpAgent,
    httpsAgent,
    // An env-configured proxy would do the DNS resolution itself and bypass
    // safeLookup, so never use one for user-supplied URLs.
    proxy: false,
    beforeRedirect: (options) => {
      assertAllowedUrl(options.href || `${options.protocol}//${options.hostname}${options.path || ''}`);
    },
  });
}

module.exports = { safeGet, assertAllowedUrl, isBlockedAddress, safeLookup, httpsAgent };
