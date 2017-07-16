import React from 'react';
import graphql from 'graphql';
import PropTypes from 'proptypes';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import typography from '../utils/typography';
const rhythm = typography.rhythm;
const profilePic = require('../images/kyle-round-small-pantheon.jpg');

class BlogIndexRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const posts = this.props.data.allMarkdownRemark.edges;
    const { siteMetadata } = this.props.data.site;

    return (
      <div>
        <Helmet title={siteMetadata.title} />
        <p
          style={{
            marginBottom: rhythm(1.5),
          }}
        >
          <img
            src={profilePic}
            style={{
              borderRadius: '100%',
              float: 'left',
              marginRight: rhythm(1 / 4),
              marginBottom: 0,
              width: rhythm(2),
              height: rhythm(2),
            }}
          />
          Written by <strong>
            {siteMetadata.author.name}
          </strong>{' '}
          who lives and works in {siteMetadata.author.homeCity} building really useful things.
          You should{' '}
          <a href="https://twitter.com/ocanaangelo">follow him on Twitter</a>
        </p>
        <ul
          style={{
            marginBottom: 0,
          }}
        >
          {posts.map(post =>
            <li key={post.node.fields.slug}>
              <Link
                style={{
                  textDecoration: 'none',
                }}
                to={post.node.fields.slug}
              >
                {post.node.frontmatter.title}
              </Link>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default BlogIndexRoute;

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
        author {
          homeCity,
          name
        }        
      }
    }
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { draft: { ne: true } } }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
`;
