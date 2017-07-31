import React from 'react';
import PropTypes from 'proptypes';
import Link from './Link';
import Helmet from 'react-helmet';
import Menu from './Menu';
import styled from 'styled-components';

const Title = styled(Link)`
  display: block;
  font-size: ${props => props.theme.header.title.fontSize};
  text-align: ${props => props.theme.header.title.textAlign};
  padding: ${props => props.theme.header.title.padding};
  margin: ${props => props.theme.header.title.margin};
  line-height: ${props => props.theme.header.title.lineHeight};
`;

const SubTitle = styled.p`
  font-size: ${props => props.theme.header.subTitle.fontSize};
  padding: ${props => props.theme.header.subTitle.padding};
  margin: ${props => props.theme.header.subTitle.margin};
`;

class Header extends React.Component {
  static propTypes = {
    siteMetadata: PropTypes.object
  }

  render() {
    const { siteMetadata } = this.props;

    return (
      <header>
        <Helmet defaultTitle={siteMetadata.title} titleTemplate={`${siteMetadata.header.title} | %s`} />
        <Title to="/">
          {siteMetadata.header.title}
          <SubTitle>{siteMetadata.header.subTitle}</SubTitle>
        </Title>
        <Menu />
      </header>
    );
  }
}

export default Header;
