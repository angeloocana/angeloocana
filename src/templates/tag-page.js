import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from '../components/Link';

const TagRoute = ({data, pathContext}) => {
  const posts = data.allMarkdownRemark.edges;
  console.log('tag pathContext', pathContext);
  const allTagsLink = `/${pathContext.langKey}/tags/`;
  const postLinks = posts.map(post => {
    return (
      <li key={post.node.fields.slug}>
        <Link to={post.node.fields.slug}>
          {post.node.frontmatter.title}
        </Link>
      </li>
    );
  });

  return (
    <div>
      <h2>
        {data.allMarkdownRemark.totalCount} posts tagged with “{pathContext.tag}”
      </h2>
      <ul>
        {postLinks}
      </ul>
      <p>
        <Link to={allTagsLink}>Browse all tags</Link>
      </p>
    </div>
  );
};

TagRoute.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default TagRoute;

export const pageQuery = graphql`
  query TagPage($tag: String, $langKey: String) {
  allMarkdownRemark(limit: 1000,
    sort: {fields: [frontmatter___date], order: DESC},
    filter: {
      frontmatter: {
        tags: {in: [$tag]},
        draft: {ne: true}},
      fields: {
        langKey: {eq: $langKey}
      }
    }) {
    totalCount
    edges {
      node {
        fields {
          slug
          langKey
        }
        frontmatter {
          tags
          title
        }
      }
    }
  }
  }
`;
