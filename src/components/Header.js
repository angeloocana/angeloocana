import React from 'react';
// import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';
import typography from '../utils/typography';
const rhythm = typography.rhythm;
const scale = typography.scale;

class Header extends React.Component {
    static propTypes = {
        // data: PropTypes.object
    }

    render() {
        console.log('Header props', this.props);

        // const { siteMetadata } = this.props.data.site;

        const siteMetadata = {
            header: {
                title: 'Angelo Ocana',
                subTitle: 'Software Development and Training'
            }
        };

        return (
          <div>
            <Helmet defaultTitle={siteMetadata.title} titleTemplate={`${siteMetadata.header.title} | %s`} />
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
                {siteMetadata.header.title}
              </h1>
              <p>{siteMetadata.header.subTitle}</p>
            </Link>
          </div>
        );
    }
}

export default Header;

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
