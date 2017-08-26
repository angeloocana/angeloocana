import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';

const Blog = ({data, pathContext}) => {
  return (
    <PostList
      posts={data.allMarkdownRemark.edges}
      currentLangKey={pathContext.langKey}
    />
  );
};

Blog.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default Blog;
