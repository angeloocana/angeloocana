import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';
import H1 from '../components/H1';

const Blog = (props) => {
  return (
    <section className="posts">
      <header>
        <H1>
          {props.i18n.title}
        </H1>
      </header>
      <PostList
        posts={props.data.allMarkdownRemark.edges.map(p => p.node)}
      />
    </section>
  );
};

Blog.propTypes = {
  data: PropTypes.object.isRequired,
  i18n: PropTypes.object.isRequired
};

export default Blog;
