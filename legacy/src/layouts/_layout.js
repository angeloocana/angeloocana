import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styled, { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';

import {IntlProvider} from 'react-intl';
import 'intl';
import {
  getLangs,
  getUrlForLang,
  getCurrentLangKey,
  isHomePage
} from 'ptz-i18n';

const Background = styled.div`
  background-color: ${props => props.theme.bg};
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  min-height: 100%;
  overflow-x: hidden;
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
  const isHome = isHomePage(url);

  const {langs, defaultLangKey} = props.data.site.siteMetadata.languages;
  const langKey = getCurrentLangKey(langs, defaultLangKey, url);

  const homeLink = `/${langKey}/`;
  const langsMenu = getLangs(langs, langKey, getUrlForLang(homeLink, url));

  const {menu, author, sourceCodeLink} = props.data.site.siteMetadata;

  return (
    <ThemeProvider theme={theme}>
      <IntlProvider 
        locale={langKey} 
        messages={props.i18nMessages}
      >
        <Background>
          <BodyContainer>
            <Header
              isHome={isHome}
              langs={langsMenu}
              homeLink={homeLink}
              url={url}
              menu={menu}    
            />
            <main>
              {children()}
            </main>
            <Footer
              currentLangKey={langKey}
              author={author}
              sourceCodeLink={sourceCodeLink}
            />
          </BodyContainer>
        </Background>
      </IntlProvider>
    </ThemeProvider>
  );
};

Wrapper.propTypes = {
  children: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  i18nMessages: PropTypes.object.isRequired
};

export default Wrapper;
