import React from 'react';
import graphql from 'graphql';
import PropTypes from 'proptypes';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';

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
