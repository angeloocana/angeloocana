import React from 'react';
import PropTypes from 'proptypes';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';

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
        <Link className="page-title" to="/">
          {siteMetadata.header.title}
          <p>{siteMetadata.header.subTitle}</p>
        </Link>
      </header>
    );
  }
}

export default Header;
