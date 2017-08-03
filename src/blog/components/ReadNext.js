import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from '../../core/components/Link';

class Component extends React.Component {
  static propTypes = {
    nextPost: PropTypes.object
  };

  render() {
    let { nextPost } = this.props;
    if (nextPost && nextPost.children && nextPost.children[0]) {
      nextPost = nextPost.children[0];
    }

    if (!nextPost) {
      return null;
    } else {
      return (
        <div>
          <h6>
            READ THIS NEXT:
          </h6>
          <h3>
            <Link to={nextPost.fields.slug}>
              {nextPost.frontmatter.title}
            </Link>
          </h3>
          <p>
            {nextPost.excerpt}
          </p>
          <hr />
        </div>
      );
    }
  }
};

export default Component;

export const query = graphql`
  fragment ReadNext on MarkdownRemark {
    fields {
      slug
    }
    excerpt(pruneLength: 200)
    frontmatter {
      title
    }
  }
`;
