import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { siteMetadata as allSiteMetada } from '../../gatsby-config';
import styled, { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';
import {getMessages} from '../data/messages';

import {addLocaleData, IntlProvider} from 'react-intl';
import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';
import pt from 'react-intl/locale-data/pt';

import 'intl';
import 'intl/locale-data/jsonp/en';
import 'intl/locale-data/jsonp/fr';
import 'intl/locale-data/jsonp/pt';

import {
  getLangs,
  getUrlForLang,
  getCurrentLangKey,
  isHomePage
} from 'ptz-i18n';

addLocaleData([...en, ...fr, ...pt]);

const Background = styled.div`
  background-color: ${props => props.theme.bg};
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;
`;

const BodyContainer = styled.div`
  font-family: ${props => props.theme.fontFamily};
  color: ${props => props.theme.color};
  background-color: ${props => props.theme.bg};
  padding: ${props => props.theme.padding};
  margin: ${props => props.theme.margin};
  max-width: ${props => props.theme.maxWidth};

  font-feature-settings: "calt" 1, "clig" 1, "dlig" 1, "kern" 1, "liga" 1, "salt" 1;
`;

const Wrapper = (props) => {
  const { children, location } = props;
  const url = location.pathname;
  const langKey = getCurrentLangKey(url);
  const isHome = isHomePage(url);
  const homeLink = `/${langKey}/`;
  const langs = getLangs(langKey, getUrlForLang(homeLink, url));

  const siteMetadata = allSiteMetada[langKey];

  return (
    <ThemeProvider theme={theme}>
      <IntlProvider 
        locale={langKey} 
        messages={getMessages(langKey)}
      >
        <Background>
          <BodyContainer>
            <Header
              siteMetadata={siteMetadata}
              isHome={isHome}
              langs={langs}
              homeLink={homeLink}
              url={url}
            />
            <main>
              {children()}
            </main>
            <Footer
              currentLangKey={langKey}
              siteMetadata={siteMetadata}
            />
          </BodyContainer>
        </Background>
      </IntlProvider>
    </ThemeProvider>
  );
};

Wrapper.propTypes = {
  children: PropTypes.func,
  location: PropTypes.object
};

export default Wrapper;
