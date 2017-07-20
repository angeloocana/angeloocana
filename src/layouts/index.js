import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { siteMetadata } from '../../gatsby-config';
import styled, { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';
import '../css/reset.css';
import '../css/prism-coy.css';

const BodyContainer = styled.div`
    font-family: ${props => props.theme.fontFamily};
    color: ${props => props.theme.color};
    background-color: ${props => props.theme.bg};
    padding: ${props => props.theme.padding};
    margin: ${props => props.theme.margin};
    max-width: ${props => props.theme.maxWidth};

    -moz-font-feature-settings: "calt=1", "clig=1", "dlig=1", "kern=1", "liga=1", "salt=1";
    -moz-font-feature-settings: "calt" 1, "clig" 1, "dlig" 1, "kern" 1, "liga" 1, "salt" 1;
    -webkit-font-feature-settings: "calt" 1, "clig" 1, "dlig" 1, "kern" 1, "liga" 1, "salt" 1;
    -ms-font-feature-settings: "calt=1", "clig=1", "dlig=1", "kern=1", "liga=1", "salt=1";
    -o-font-feature-settings: "calt" 1, "clig" 1, "dlig" 1, "kern" 1, "liga" 1, "salt" 1;
    font-feature-settings: "calt" 1, "clig" 1, "dlig" 1, "kern" 1, "liga" 1, "salt" 1;
`;

class Wrapper extends React.Component {
  static propTypes = {
    children: PropTypes.func
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <BodyContainer>
          <Header siteMetadata={siteMetadata} />
          <main>
            {this.props.children()}
          </main>
          <Footer author={siteMetadata.author} />
        </BodyContainer>
      </ThemeProvider>
    );
  }
}

export default Wrapper;
