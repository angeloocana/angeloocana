/**
 * Get current language key.
 * @param {String} browserLang default browser language key
 * @param {String} url browser url
 * @returns {String} current langKey
 */
const getCurrentLangKey = (browserLang, url) => {
  const langKey = (url || `/${browserLang}/`).split('/')[1];
  return langKey === '' ? browserLang : langKey;
};

/**
 * Get language home link.
 * @param {*} browserLang default browser language key.
 * @param {*} url browser url.
 * @returns {String} home url.
 */
const getHomeLink = (browserLang, url) => {
  return `/${getCurrentLangKey(browserLang, url)}/`;
};

/**
 * Get url to the language.
 * @param {String} langKey default browser language key.
 * @param {String} url  browser url
 * @returns {String} new url
 */
const getLangUrl = (langKey, url) => {
  const homeLink = getHomeLink(langKey, url);
  return url === '/'
    ? homeLink
    : url.replace(homeLink, `/${langKey}/`);
};

/**
 * Get langs to create Menu.
 * @param {String} browserLang default browser language key.
 * @param {String} url  browser url.
 * @returns {Array} langs menu data.
 */
const getLangs = (browserLang, url) => {
  const langs = ['en', 'fr', 'pt'];
  const currentLangKey = getCurrentLangKey(browserLang, url);

  return langs.map(langKey => {
    return {
      langKey,
      selected: currentLangKey === langKey,
      link: getLangUrl(langKey, url)
    };
  });
};

export {
  getCurrentLangKey,
  getHomeLink,
  getLangs,
  getLangUrl
};
