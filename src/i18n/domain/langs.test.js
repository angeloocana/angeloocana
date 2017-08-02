import {
	getCurrentLangKey,
	getLangs,
	getLangUrl
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
	describe('getLangUrl', () => {
		it('/ & en => /en/', () => {
			const url = '/';
			const lang = 'en';
			assert.equal(getLangUrl(lang, url), '/en/');
		});
		it('/ & pt => /pt/', () => {
			const url = '/';
			const lang = 'pt';
			assert.equal(getLangUrl(lang, url), '/pt/');
		});
		it('/en/ & en => /en/', () => {
			const url = '/en/';
			const lang = 'en';
			assert.equal(getLangUrl(lang, url), '/en/');
		});
		it('/pt/ & en => /en/', () => {
			const url = '/pt/';
			const lang = 'en';
			assert.equal(getLangUrl(lang, url), '/en/');
		});
		it('/en/about/ & en => /en/about/', () => {
			const url = '/en/about/';
			const lang = 'en';
			assert.equal(getLangUrl(lang, url), '/en/about/');
		});
		it('/pt/about/ & en => /en/about/', () => {
			const url = '/pt/about/';
			const lang = 'en';
			assert.equal(getLangUrl(lang, url), '/en/about/');
		});
	});
	describe('getLangs', () => {
		it('/ & en', () => {
			const langs = getLangs('en', '/');
			const expected = [
				{
					"langKey": "en",
					"link": "/en/",
					"selected": true
				}, {
					"langKey": "fr",
					"link": "/fr/",
					"selected": false
				}, {
					"langKey": "pt",
					"link": "/pt/",
					"selected": false
				}];
			assert.deepEqual(langs, expected);
		});
	});
});
