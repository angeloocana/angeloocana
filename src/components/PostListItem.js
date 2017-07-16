import React from 'react';
import PropTypes from 'proptypes';
import Link from 'gatsby-link';
import graphql from 'graphql';

const getToLink = (post) =>
  post.node.frontmatter.path || post.node.fields.slug;

const PostListItem = ({ post }) => {
  return (
    <li key={post.node.fields.slug}>
      <time pubdate>{post.node.frontmatter.date}</time>
      <Link
        style={{
          textDecoration: 'none',
        }}
        to={getToLink(post)}
      >
        {post.node.frontmatter.title}
      </Link>
      <p>{post.node.excerpt}</p>
    </li>
  );
};

PostListItem.propTypes = {
  post: PropTypes.object
};

export default PostListItem;

export const pageQuery = graphql`
  fragment postListItem on MarkdownRemark {
    frontmatter{
      title,
      tags,
      date,
      path
    },
    fields{
      slug,
      tagSlugs
    },
    excerpt 
  }
`;
