const getCurrentLangKey = (browserLang, url) => {
  const langKey = (url || `/${browserLang}/`).split('/')[1];
  return langKey === '' ? browserLang : langKey;
};

const getLangUrl = (langKey, url) => {
  const currentLang = `/${getCurrentLangKey(langKey, url)}/`;
  return url === '/'
    ? currentLang
    : url.replace(currentLang, `/${langKey}/`);
};

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
  getLangs,
  getLangUrl
};
