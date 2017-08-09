import { curry, startsWith } from 'ramda';

/**
 * Gets the number of paths in a url
 * @param {*} url pathName
 * @returns {Number} number of paths
 */
const nPaths = (url) => (url.match(/\//g) || []).length - 1;

/**
 * Checks if the url is /, /en/ or /pt/
 * @param {*} url this.props.location
 * @returns {Boolean} is home or not
 */
const isHomePage = (url) => nPaths(url) <= 1;

const defaultLangKey = 'en';

/**
 * Get current language key. 
 * @param {String} url browser url
 * @param {String} browserLang default browser language key
 * @returns {String} current langKey
 */
const getCurrentLangKey = (url, browserLang = defaultLangKey) => {
  const langKey = (url || `/${browserLang}/`).split('/')[1];
  switch (langKey === '' ? browserLang : langKey) {
  case 'en': return 'en';
  case 'fr': return 'fr';
  case 'pt': return 'pt';
  default: return 'en';
  }
};

/**
 * Get url to the language
 * @param {String} homeLink  link for the home page
 * @param {String} url  browser url
 * @param {String} langKey default browser language key
 * @returns {String} new url
 */
const getUrlForLang = curry((homeLink, url, langKey) => {
  return url === '/' || !startsWith(homeLink, url)
    ? `/${langKey}/`
    : url.replace(homeLink, `/${langKey}/`);
});

/**
 * Get langs to create Menu
 * @param {String} currentLangKey current Lang Key
 * @param {func} getUrlForLang getUrlForLang curried, waiting for langKey
 * @returns {Array} langs menu data
 */
const getLangs = (currentLangKey, getUrlForLang) => {
  const langs = ['en', 'fr', 'pt'];

  return langs.map(langKey => {
    return {
      langKey,
      selected: currentLangKey === langKey,
      link: getUrlForLang(langKey)
    };
  });
};

export {
  getCurrentLangKey,
  getLangs,
  getUrlForLang,
  nPaths,
  isHomePage
};
