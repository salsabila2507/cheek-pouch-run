/** Optional Sepolia burrow seal: SQK approve(self, 0). Play works without a wallet. */
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = '0xaa36a7';
export const SQK_TOKEN = '0x5501e1fa81be1c3f49225fa7668da0245d07db60';
export const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
export const EXPLORER_TX = 'https://sepolia.etherscan.io/tx/';
export const EXPLORER_ADDR = 'https://sepolia.etherscan.io/address/';
export const RPCS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://rpc.sepolia.org',
];

export const SEAL_WINDOW_MS = 60_000;
export const SEAL_NEST_BOOST = 8;

/** Nest soft-start only when sealing after a bank or inside a Live block window. */
export function sealGrantsNestBoost({ mode = 'live', banked = 0, lastBlockAt = null, now = Date.now() } = {}) {
  if (Number(banked) > 0) return true;
  if (mode === 'live' && lastBlockAt != null && now - lastBlockAt <= SEAL_WINDOW_MS) return true;
  return false;
}

export function sealWindowLabel({ mode = 'live', banked = 0, lastBlockAt = null, now = Date.now() } = {}) {
  if (Number(banked) > 0) return 'Checkpoint open · banked seeds ready to seal';
  if (mode === 'live' && lastBlockAt != null) {
    const left = Math.max(0, SEAL_WINDOW_MS - (now - lastBlockAt));
    if (left > 0) return `Live block window · ${Math.ceil(left / 1000)}s to seal for nest soft-start`;
  }
  return 'Seal anytime for the chain mark · nest soft-start needs a bank or Live block window';
}

const ZERO32 = '0'.repeat(64);

export function shortAddr(addr) {
  if (!addr || typeof addr !== 'string' || addr.length < 10) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function encodeApproveSelf(from) {
  const clean = String(from || '').toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{40}$/.test(clean)) throw new Error('Need a wallet address');
  return `0x095ea7b3${clean.padStart(64, '0')}${ZERO32}`;
}

export function isSelfZeroApproval(log) {
  const owner = (log?.topics?.[1] || '').toLowerCase();
  const spender = (log?.topics?.[2] || '').toLowerCase();
  const value = (log?.data || '0x').toLowerCase().replace(/^0x/, '');
  if (!owner || owner.length !== 66 || owner !== spender) return false;
  return !value || /^0+$/.test(value);
}

export function stampFromLog(log) {
  if (!isSelfZeroApproval(log)) return null;
  const owner = `0x${log.topics[1].slice(26)}`;
  return {
    address: owner,
    short: shortAddr(owner),
    txHash: log.transactionHash,
    txUrl: `${EXPLORER_TX}${log.transactionHash}`,
    blockNumber: Number.parseInt(log.blockNumber, 16),
  };
}

async function rpc(url, method, params, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || 'RPC error');
  return body.result;
}

async function withRpcs(run, fetchImpl = globalThis.fetch) {
  let last;
  for (const url of RPCS) {
    try {
      return await run(url);
    } catch (error) {
      last = error;
    }
  }
  throw last || new Error('No Sepolia RPC');
}

export async function fetchRecentSeals({ fetchImpl = globalThis.fetch, lookback = 4000, limit = 12 } = {}) {
  return withRpcs(async (url) => {
    const tipHex = await rpc(url, 'eth_blockNumber', [], fetchImpl);
    const tip = Number.parseInt(tipHex, 16);
    const from = Math.max(0, tip - lookback);
    const logs = await rpc(url, 'eth_getLogs', [{
      address: SQK_TOKEN,
      fromBlock: `0x${from.toString(16)}`,
      toBlock: 'latest',
      topics: [APPROVAL_TOPIC],
    }], fetchImpl);
    const stamps = [];
    for (let i = (logs || []).length - 1; i >= 0 && stamps.length < limit; i--) {
      const stamp = stampFromLog(logs[i]);
      if (stamp) stamps.push(stamp);
    }
    return stamps;
  }, fetchImpl);
}

function provider(ethereum = globalThis.ethereum) {
  if (!ethereum) throw new Error('No wallet in this browser');
  return ethereum;
}

export async function connectWallet(ethereum = globalThis.ethereum) {
  const eth = provider(ethereum);
  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  const address = accounts?.[0];
  if (!address) throw new Error('Wallet returned no account');
  return address;
}

export async function ensureSepolia(ethereum = globalThis.ethereum) {
  const eth = provider(ethereum);
  const chainId = await eth.request({ method: 'eth_chainId' });
  if (String(chainId).toLowerCase() === SEPOLIA_CHAIN_HEX) return;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (error) {
    if (error?.code === 4902 || /Unrecognized chain/i.test(String(error?.message || ''))) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_HEX,
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: RPCS,
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
      return;
    }
    throw error;
  }
}

export async function sendBurrowSeal(from, ethereum = globalThis.ethereum) {
  const eth = provider(ethereum);
  await ensureSepolia(eth);
  const data = encodeApproveSelf(from);
  const txHash = await eth.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: SQK_TOKEN,
      data,
      value: '0x0',
    }],
  });
  return { txHash, txUrl: `${EXPLORER_TX}${txHash}` };
}

export function createBurrowSeal({
  document = globalThis.document,
  ethereum = globalThis.ethereum,
  fetchImpl = globalThis.fetch,
  getSeedCount = () => 0,
  getSealContext = () => ({ mode: 'live', banked: 0, lastBlockAt: null, now: Date.now() }),
  onNotice = () => {},
  onSealed = () => {},
} = {}) {
  const $ = (id) => document.getElementById(id);
  let address = null;
  let busy = false;

  function setStatus(text) {
    const node = $('seal-status');
    if (node) node.textContent = text;
  }

  function paintWallet() {
    const connected = Boolean(address);
    const connectBtn = $('seal-connect');
    const stampBtn = $('seal-stamp');
    const resultStamp = $('result-seal-stamp');
    const resultConnect = $('result-seal-connect');
    const addr = $('seal-address');
    const ctx = getSealContext() || {};
    const boostReady = sealGrantsNestBoost(ctx);
    if (connectBtn) {
      connectBtn.hidden = connected;
      connectBtn.disabled = busy;
    }
    if (stampBtn) {
      stampBtn.hidden = !connected;
      stampBtn.disabled = busy || !connected;
      stampBtn.textContent = boostReady
        ? 'Seal checkpoint · nest soft-start ↗'
        : 'Seal this burrow on Sepolia ↗';
    }
    if (resultConnect) {
      resultConnect.hidden = connected;
      resultConnect.disabled = busy;
    }
    if (resultStamp) {
      resultStamp.hidden = !connected;
      resultStamp.disabled = busy || !connected;
    }
    if (addr) {
      addr.hidden = !connected;
      addr.textContent = connected ? shortAddr(address) : '';
      addr.href = connected ? `${EXPLORER_ADDR}${address}` : '#';
    }
    const seeds = getSeedCount();
    const seedLabel = $('seal-seeds');
    if (seedLabel) seedLabel.textContent = String(seeds);
    const windowNote = $('seal-window-note');
    if (windowNote) windowNote.textContent = sealWindowLabel(ctx);
    const resultNote = $('result-seal-note');
    if (resultNote) {
      resultNote.textContent = boostReady
        ? 'Seal this checkpoint on Sepolia. Next Live run starts with nest soft-start.'
        : 'Optional chain mark. Nest soft-start unlocks after a bank or Live block window.';
    }
  }

  function renderWall(stamps) {
    const list = $('seal-wall');
    if (!list) return;
    list.replaceChildren();
    if (!stamps.length) {
      const empty = document.createElement('li');
      empty.className = 'seal-empty';
      empty.textContent = 'No recent seals in this Sepolia window yet.';
      list.append(empty);
      return;
    }
    for (const stamp of stamps) {
      const li = document.createElement('li');
      const who = document.createElement('span');
      who.textContent = stamp.short;
      const link = document.createElement('a');
      link.href = stamp.txUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'tx ↗';
      li.append(who, link);
      list.append(li);
    }
  }

  async function refreshWall() {
    const wallNote = $('seal-wall-note');
    try {
      const stamps = await fetchRecentSeals({ fetchImpl });
      renderWall(stamps);
      if (wallNote) wallNote.textContent = 'Self-zero SQK approvals on Sepolia. Shared signal with other fan apps.';
    } catch {
      if (wallNote) wallNote.textContent = 'Could not read Sepolia logs right now.';
    }
  }

  async function connect() {
    if (busy) return;
    busy = true;
    paintWallet();
    try {
      address = await connectWallet(ethereum);
      await ensureSepolia(ethereum);
      setStatus('Wallet on Sepolia. Ready to seal.');
      onNotice('Wallet connected on Sepolia.');
    } catch (error) {
      const msg = error?.code === 4001 ? 'Connect cancelled.' : (error?.message || 'Wallet connect failed.');
      setStatus(msg);
      onNotice(msg, 4);
    } finally {
      busy = false;
      paintWallet();
    }
  }

  async function stamp() {
    if (busy || !address) return;
    busy = true;
    paintWallet();
    setStatus('Confirm the approve in your wallet…');
    try {
      await ensureSepolia(ethereum);
      const ctx = getSealContext() || {};
      const { txHash, txUrl } = await sendBurrowSeal(address, ethereum);
      const last = $('seal-last');
      if (last) {
        last.hidden = false;
        last.href = txUrl;
        last.textContent = `Last seal ${shortAddr(txHash)} ↗`;
      }
      const boost = sealGrantsNestBoost(ctx);
      setStatus(boost
        ? 'Checkpoint sealed. Next Live run gets nest soft-start. Seeds stay local.'
        : 'Seal sent. Seeds stay local game points.');
      onNotice(boost ? 'Checkpoint sealed · nest soft-start armed.' : 'Burrow sealed on Sepolia.', 4);
      onSealed({ txHash, txUrl, address, boost, seeds: Number(ctx.banked) || getSeedCount() || 0, context: ctx });
      void refreshWall();
    } catch (error) {
      const msg = error?.code === 4001 ? 'Seal cancelled.' : (error?.message || 'Seal failed.');
      setStatus(msg);
      onNotice(msg, 4);
    } finally {
      busy = false;
      paintWallet();
    }
  }

  function bind() {
    $('seal-connect')?.addEventListener('click', () => void connect());
    $('seal-stamp')?.addEventListener('click', () => void stamp());
    $('result-seal-connect')?.addEventListener('click', () => void connect());
    $('result-seal-stamp')?.addEventListener('click', () => void stamp());
    ethereum?.on?.('accountsChanged', (accounts) => {
      address = accounts?.[0] || null;
      paintWallet();
      setStatus(address ? 'Wallet changed.' : 'Wallet disconnected.');
    });
    ethereum?.on?.('chainChanged', () => {
      setStatus('Network changed. Seal needs Sepolia.');
    });
    paintWallet();
    void refreshWall();
  }

  return { bind, paintWallet, refreshWall, stamp, connect, get address() { return address; } };
}
