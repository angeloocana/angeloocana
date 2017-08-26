import React from 'react';
import PropTypes from 'proptypes';
import Link from './Link';
import Helmet from 'react-helmet';
import Menu from './Menu';
import styled from 'styled-components';
import SelectLanguage from './SelectLanguage';

const headerTheme = (props) =>
  props.isHome
    ? props.theme.header.isHome
    : props.theme.header;

const Title = styled(Link)`
  display: block;
  font-size: ${props => headerTheme(props).title.fontSize};
  text-align: ${props => headerTheme(props).title.textAlign};
  padding: ${props => headerTheme(props).title.padding};
  margin: ${props => headerTheme(props).title.margin};
  line-height: ${props => headerTheme(props).title.lineHeight};
`;

const SubTitle = styled.p`
  font-size: ${props => headerTheme(props).subTitle.fontSize};
  padding: ${props => headerTheme(props).subTitle.padding};
  margin: ${props => headerTheme(props).subTitle.margin};
`;

const Header = ({ siteMetadata, isHome, langs, homeLink, url }) => {
  return (
    <header>
      <Helmet
        defaultTitle={siteMetadata.title}
        titleTemplate={`%s | ${siteMetadata.title}`} 
      />
      <SelectLanguage langs={langs} />
      <Title to={homeLink} isHome={isHome}>
        {siteMetadata.header.title}
        <SubTitle isHome={isHome}>{siteMetadata.header.subTitle}</SubTitle>
      </Title>
      <Menu menu={siteMetadata.menu} url={url} />
    </header>
  );
};

Header.propTypes = {
  siteMetadata: PropTypes.object,
  isHome: PropTypes.bool,
  langs: PropTypes.array,
  homeLink: PropTypes.string,
  url: PropTypes.string
};

export default Header;
