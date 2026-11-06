import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeApproveSelf,
  isSelfZeroApproval,
  stampFromLog,
  shortAddr,
  SQK_TOKEN,
  sealGrantsNestBoost,
  sealWindowLabel,
  SEAL_WINDOW_MS,
  SEAL_NEST_BOOST,
} from '../src/onchain.js';

test('encodeApproveSelf pads address and zero amount', () => {
  const data = encodeApproveSelf('0x5501e1fa81be1c3f49225fa7668da0245d07db60');
  assert.equal(data.slice(0, 10), '0x095ea7b3');
  assert.equal(data.length, 2 + 8 + 64 + 64);
  assert.match(data, /5501e1fa81be1c3f49225fa7668da0245d07db60/i);
  assert.equal(data.slice(-64), '0'.repeat(64));
});

test('encodeApproveSelf rejects junk', () => {
  assert.throws(() => encodeApproveSelf('not-an-address'));
});

test('self-zero approval filter', () => {
  const owner = '0x' + '0'.repeat(24) + 'aabbccddeeff00112233445566778899aabbccdd';
  const good = {
    topics: [
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      owner,
      owner,
    ],
    data: '0x' + '0'.repeat(64),
    transactionHash: '0xabc',
    blockNumber: '0x10',
  };
  assert.equal(isSelfZeroApproval(good), true);
  const stamp = stampFromLog(good);
  assert.equal(stamp.address, '0xaabbccddeeff00112233445566778899aabbccdd');
  assert.equal(stamp.txHash, '0xabc');
  const other = { ...good, topics: [good.topics[0], owner, '0x' + '1'.repeat(64)] };
  assert.equal(isSelfZeroApproval(other), false);
  assert.equal(stampFromLog(other), null);
});

test('shortAddr and token constant', () => {
  assert.equal(shortAddr('0x5501e1fa81be1c3f49225fa7668da0245d07db60'), '0x5501…db60');
  assert.match(SQK_TOKEN, /^0x[0-9a-f]{40}$/);
});

test('nest boost only after bank or live block window', () => {
  const now = 1_000_000;
  assert.equal(sealGrantsNestBoost({ mode: 'live', banked: 12, now }), true);
  assert.equal(sealGrantsNestBoost({ mode: 'practice', banked: 12, now }), true);
  assert.equal(sealGrantsNestBoost({ mode: 'live', banked: 0, lastBlockAt: now - 1000, now }), true);
  assert.equal(sealGrantsNestBoost({ mode: 'live', banked: 0, lastBlockAt: now - SEAL_WINDOW_MS - 1, now }), false);
  assert.equal(sealGrantsNestBoost({ mode: 'practice', banked: 0, lastBlockAt: now, now }), false);
  assert.equal(SEAL_NEST_BOOST, 8);
  assert.match(sealWindowLabel({ mode: 'live', banked: 5, now }), /banked/i);
});
