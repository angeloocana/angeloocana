import React from 'react';
import PropTypes from 'proptypes';
import PostList from './PostList';
import H2 from './H2';

const getTitle = () => ({
  en: 'Read Next',
  pt: 'Mais posts',
  fr: 'Lisez la suite'
});

const ReadNext = (props) => {
  return props.posts
    ? (
      <section>
        <header>
          <H2>
            {getTitle()[props.langKey]}
          </H2>
        </header>
        <PostList
          posts={props.posts}
        />
      </section>
    )
    : null;
};

ReadNext.propTypes = {
  posts: PropTypes.array,
  langKey: PropTypes.string.isRequired
};

export default ReadNext;
