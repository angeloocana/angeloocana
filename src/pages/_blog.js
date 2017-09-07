import React from 'react';
import PropTypes from 'proptypes';
import Posts from '../components/Posts';

const Blog = ({data, pathContext}) => {
  return (
    <Posts
      posts={data.allMarkdownRemark.edges.map(p => p.node)}
      currentLangKey={pathContext.langKey}
    />
  );
};

Blog.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired
};

export default Blog;
