import React from 'react';
import PropTypes from 'prop-types';
import Link from './Link';
import Helmet from 'react-helmet';
import Menu from './Menu';
import styled from 'styled-components';
import SelectLanguage from './SelectLanguage';
import { FormattedMessage } from 'react-intl';

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

const Wrapper = styled.header`

  ${({theme, isHome}) => isHome
    ? ``
    : `
      @media (min-width: 40rem) {  
      
        display: flex;
        justify-content: space-between;
    
        .title {
          padding-top: ${theme.scale(2)};
          order: 0;          
        }
    
        .select-languages{
          order: 1;          
        }    
      }
  `}  
`;

const Header = ({ menu, isHome, langs, homeLink, url }) => {
  return (
    <Wrapper isHome={isHome}>
      <FormattedMessage id="title">
        {(txt) => (
          <Helmet
            defaultTitle={txt}
            titleTemplate={`%s | ${txt}`}
          />
        )}
      </FormattedMessage>
      <SelectLanguage langs={langs} className="select-languages" />
      <FormattedMessage id="header.title">
        {(title) => (
          <Title to={homeLink} isHome={isHome} className="title">
            {title}
            <FormattedMessage id="header.subTitle">
              {(subTitle) => (
                <SubTitle isHome={isHome}>{subTitle}</SubTitle>
              )}
            </FormattedMessage>
          </Title>
        )}
      </FormattedMessage>
      <Menu menu={menu} url={url} />
    </Wrapper>
  );
};

Header.propTypes = {
  menu: PropTypes.array.isRequired,
  isHome: PropTypes.bool,
  langs: PropTypes.array,
  homeLink: PropTypes.string,
  url: PropTypes.string
};

export default Header;
