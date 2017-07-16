import React from "react";
import graphql from 'graphql';
import Link from "gatsby-link";

import { scale } from "../utils/typography";

const Component = React.createClass({
  render() {
    //console.log(this.props)
    let { nextPost } = this.props;
    if (nextPost && nextPost.children && nextPost.children[0]) {
      nextPost = nextPost.children[0];
    }

    if (!nextPost) {
      return null;
    } else {
      return (
        <div>
          <h6
            style={{
              ...scale(-0.5),
              margin: 0,
              letterSpacing: -0.25,
            }}
          >
            READ THIS NEXT:
          </h6>
          <h3
            style={{
              margin: 0,
            }}
          >
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
  },
});

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
