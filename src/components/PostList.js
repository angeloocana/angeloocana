import React from 'react';
import PropTypes from 'proptypes';
import PostListItem from './PostListItem';

const PostList = ({ posts }) => {
  return (
    <section className="post-list">
      <header>
        <h1>Posts</h1>
      </header>
      <nav>
        <ul>
          {posts.map(post =>
            <PostListItem post={post} />
          )}
        </ul>
      </nav>
    </section>
  );
};

PostList.propTypes = {
  posts: PropTypes.array
};

export default PostList;
