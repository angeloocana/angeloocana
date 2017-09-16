import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';
import H1 from '../components/H1';
import { FormattedMessage } from 'react-intl';

const Blog = (props) => {
  return (
    <section className="posts">
      <header>
        <FormattedMessage id="posts">
          {(txt) => (
            <H1>
              {txt}
            </H1>
          )}
        </FormattedMessage>
      </header>
      <PostList
        posts={props.data.allMarkdownRemark.edges.map(p => p.node)}
      />
    </section>
  );
};

Blog.propTypes = {
  data: PropTypes.object.isRequired
};

export default Blog;
