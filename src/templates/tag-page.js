import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from '../components/Link';

class TagRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    pathContext: PropTypes.object
  }

  render() {
    const posts = this.props.data.allMarkdownRemark.edges;
    const postLinks = posts.map(post => {
      return (
        <li key={post.node.fields.path}>
          <Link to={post.node.fields.path}>
            {post.node.frontmatter.title}
          </Link>
        </li>
      );
    });

    return (
      <div>
        <h2>
          {this.props.data.allMarkdownRemark.totalCount} posts tagged with “{this.props.pathContext.tag}”
        </h2>
        <ul>
          {postLinks}
        </ul>
        <p>
          <Link to="/tags/">Browse all tags</Link>
        </p>
      </div>
    );
  }
}

export default TagRoute;

export const pageQuery = graphql`
  query TagPage($tag: String) {
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] }, draft: { ne: true } } }
    ) {
      totalCount
      edges {
        node {
          fields {
            path
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
`;
