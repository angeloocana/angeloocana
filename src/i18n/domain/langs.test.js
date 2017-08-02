import {
  getCurrentLangKey,
  getLangs,
  getUrlForLang
} from './langs';
import * as assert from 'ptz-assert';

describe('langs', () => {
  describe('getCurrentLangKey', () => {
    it('/ & en => en', () => {
      const url = '/';
      const browserLang = 'en';
      assert.equal(getCurrentLangKey(browserLang, url), 'en');
    });
    it('/ & pt => pt', () => {
      const url = '/';
      const browserLang = 'pt';
      assert.equal(getCurrentLangKey(browserLang, url), 'pt');
    });
    it('/en/about/ & en => en', () => {
      const url = '/en/about/';
      const browserLang = 'en';
      assert.equal(getCurrentLangKey(browserLang, url), 'en');
    });
  });
  describe('getUrlForLang', () => {
    it('/ & en => /en/', () => {
      const url = '/';
      const lang = 'en';
      const home = `/${lang}/`;
      assert.equal(getUrlForLang(home, url, lang), '/en/');
    });
    it('/ & pt => /pt/', () => {
      const url = '/';
      const lang = 'pt';
      const home = `/${lang}/`;
      assert.equal(getUrlForLang(home, url, lang), '/pt/');
    });
    it('/en/ & en => /en/', () => {
      const url = '/en/';
      const lang = 'en';
      const home = `/${lang}/`;
      assert.equal(getUrlForLang(home, url, lang), '/en/');
    });
    it('/pt/ & en => /en/', () => {
      const url = '/pt/';
      const lang = 'en';
      const home = url;
      assert.equal(getUrlForLang(home, url, lang), '/en/');
    });
    it('/en/about/ & en => /en/about/', () => {
      const url = '/en/about/';
      const lang = 'en';
      const home = `/${lang}/`;
      assert.equal(getUrlForLang(home, url, lang), '/en/about/');
    });
    it('/pt/about/ & en => /en/about/', () => {
      const url = '/pt/about/';
      const lang = 'en';
      const home = `/pt/`;
      assert.equal(getUrlForLang(home, url, lang), '/en/about/');
    });
  });
  describe('getLangs', () => {
    it('/ & en', () => {
      const langs = getLangs('en', getUrlForLang('/en/', '/'));
      const expected = [
        {
          'langKey': 'en',
          'link': '/en/',
          'selected': true
        }, {
          'langKey': 'fr',
          'link': '/fr/',
          'selected': false
        }, {
          'langKey': 'pt',
          'link': '/pt/',
          'selected': false
        }];
      assert.deepEqual(langs, expected);
    });
  });
});
