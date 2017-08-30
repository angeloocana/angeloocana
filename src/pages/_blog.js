import React from 'react';
import PropTypes from 'proptypes';
import Posts from '../components/Posts';

const Blog = ({data, pathContext}) => {
  return (
    <Posts
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
