import React from 'react';
import { IntlProvider, addLocaleData } from 'react-intl';
import __intlEN from 'react-intl/locale-data/en';
import __intlPT from 'react-intl/locale-data/pt';
import App from '../App';
import getMessages from './getMessages';
import packageJson from '../../package.json';

addLocaleData(__intlEN);
addLocaleData(__intlPT);

export default function (locale) {
  const messages = getMessages(locale);
  const defaultUrl = packageJson.homepage;
  const url = locale === 'en' ? defaultUrl : `${defaultUrl}/${locale}`;
  class Main extends React.Component {
    render() {
      return (
        <IntlProvider
          locale={locale}
          messages={messages}
        >
          <App
            url={url}
          />
        </IntlProvider>
      );
    }
  }
  return Main;
}
