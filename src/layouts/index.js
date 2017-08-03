import React from 'react';
import PropTypes from 'proptypes';
import Header from '../core/components/Header';
import Footer from '../core/components/Footer';
import { siteMetadata } from '../../gatsby-config';
import styled, { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';
import {
  getLangs,
  getUrlForLang,
  getCurrentLangKey,
  isHomePage
} from '../i18n/domain/langs';

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

class Wrapper extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    location: PropTypes.object
  }

  render() {
    const browserLang = 'en';
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(browserLang, url);
    const isHome = isHomePage(url);
    const homeLink = `/${currentLangKey}/`;
    const langs = getLangs(currentLangKey, getUrlForLang(homeLink, url));

    return (
      <ThemeProvider theme={theme}>
        <Background>
          <BodyContainer>
            <Header
              siteMetadata={siteMetadata[currentLangKey]}
              isHome={isHome}
              langs={langs}
              homeLink={homeLink}
            />
            <main>
              {this.props.children()}
            </main>
            <Footer
              currentLangKey={currentLangKey}
              siteMetadata={siteMetadata[currentLangKey]}
            />
          </BodyContainer>
        </Background>
      </ThemeProvider>
    );
  }
}

export default Wrapper;
