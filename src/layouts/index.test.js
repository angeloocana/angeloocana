import { isHomePage } from './index';
import * as assert from 'ptz-assert';

describe('isHomePage', () => {
  it('/en/ true', () => {
    assert.ok(isHomePage('/en/'));
  });
  it('/pt/ true', () => {
    assert.ok(isHomePage('/pt/'));
  });
  it('/fr/ true', () => {
    assert.ok(isHomePage('fr/'));
  });
  it('/ true', () => {
    assert.ok(isHomePage('/'));
  });
  it('/en/about/ false', () => {
    assert.notOk(isHomePage('/en/'));
  });
});
