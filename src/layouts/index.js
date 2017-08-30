import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { siteMetadata as allSiteMetada } from '../../gatsby-config';
import styled, { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';
import 'moment/locale/en-ca';
import 'moment/locale/fr-ca';
import 'moment/locale/pt-br';

// Broke into files
import {
  getLangs,
  getUrlForLang,
  getCurrentLangKey,
  isHomePage
} from '../i18n/langs';

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
  const {children, location} = props;
  if(!location) console.log('wrapper: ', props);
  const url = location.pathname;
  const currentLangKey = getCurrentLangKey(url);
  const isHome = isHomePage(url);
  const homeLink = `/${currentLangKey}/`;
  const langs = getLangs(currentLangKey, getUrlForLang(homeLink, url));

  const siteMetadata = allSiteMetada[currentLangKey];

  return (
    <ThemeProvider theme={theme}>
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
            currentLangKey={currentLangKey}
            siteMetadata={siteMetadata}
          />
        </BodyContainer>
      </Background>
    </ThemeProvider>
  );
};

Wrapper.propTypes = {
  children: PropTypes.func,
  location: PropTypes.object
};

export default Wrapper;
