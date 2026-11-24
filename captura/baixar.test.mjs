import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idDoLink } from './baixar.mjs';

test('reconhece reel, post, tv e story e reconstrói a URL', () => {
  assert.deepEqual(idDoLink('https://www.instagram.com/reel/ABC123xyz/?igsh=x'),
    { tipo: 'reel', id: 'ABC123xyz', url: 'https://www.instagram.com/reel/ABC123xyz/' });
  assert.equal(idDoLink('https://instagram.com/reels/ABC123xyz/').tipo, 'reel');
  assert.equal(idDoLink('https://www.instagram.com/p/XYZ98-7/').url, 'https://www.instagram.com/p/XYZ98-7/');
  assert.equal(idDoLink('https://www.instagram.com/perfil/reel/ABCDE/').id, 'ABCDE');
  assert.equal(idDoLink('https://www.instagram.com/tv/TV12345/').url, 'https://www.instagram.com/reel/TV12345/');
});

test('recusa o que não é link de conteúdo do Instagram', () => {
  assert.equal(idDoLink('https://www.instagram.com/perfil/'), null);
  assert.equal(idDoLink('https://evil.com/instagram.com/reel/ABCDE/'), null);
  assert.equal(idDoLink('https://instagram.com.evil.com/reel/ABCDE/'), null);
  assert.equal(idDoLink('https://www.instagram.com/reel/AB;rm/'), null);
  assert.equal(idDoLink('não é link'), null);
});
