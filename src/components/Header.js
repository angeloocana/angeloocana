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
  padding-top: ${props => props.theme.header.title.paddingTop};
  padding-bottom: ${props => props.theme.header.title.paddingBottom};
`;

const SubTitle = styled.p`
  font-size: ${props => props.theme.header.subTitle.fontSize};
`;

class Header extends React.Component {
  static propTypes = {
    siteMetadata: PropTypes.object
  }

  render() {
    console.log('Header props', this.props);
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
