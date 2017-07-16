import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';
import 'typeface-alegreya';
import 'typeface-alegreya-sans';

import '../css/prism-coy.css';
import typography from '../utils/typography';
const rhythm = typography.rhythm;
const scale = typography.scale;

class Wrapper extends React.Component {
  static propTypes = {
    // data: PropTypes.object,
    location: PropTypes.object,
    children: PropTypes.func
  }

  render() {
    console.log('props', this.props);

    // const { siteMetadata } = this.props.data.site;

    const siteMetadata = {
      header: {

      }
    };

    let header;
    // Check if the location is either the front page or a tags page.
    // If so, use a big header, otherwise use a smaller one.
    if (
      ['/', '/tags/'].indexOf(this.props.location.pathname) !== -1 ||
      this.props.location.pathname.indexOf('/tags/') !== -1
    ) {
      header = (
        <Link
          style={{
            textDecoration: 'none',
            boxShadow: 'none',
            color: 'inherit',
          }}
          to="/"
        >
          <h1
            style={{
              ...scale(1.5),
              marginBottom: rhythm(1),
              marginTop: 0,
            }}
          >
            Bricolage
          </h1>
        </Link>
      );
    } else {
      header = (
        <Link
          style={{
            textDecoration: 'none',
            boxShadow: 'none',
            color: 'inherit',
          }}
          to="/"
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            {siteMetadata.header.title}
          </h3>
          <span>{siteMetadata.header.subTitle}</span>
        </Link>
      );
    }
    return (
      <div
        style={{
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
          maxWidth: rhythm(22),
          margin: '0 auto',
        }}
      >
        <Helmet defaultTitle={siteMetadata.title} titleTemplate={`${siteMetadata.header.title} | %s`} />
        <div>
          {header}
        </div>
        {this.props.children()}
      </div>
    );
  }
}

export default Wrapper;

export const pageQuery = graphql`
  query LayoutsQuery {
    site {
      siteMetadata {
        header{
          title,
          subTitle
        }
      }
    }
  }
`;
