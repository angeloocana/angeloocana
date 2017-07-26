import React from 'react';
import PropTypes from 'proptypes';
import PostListItem from './PostListItem';
import styled from 'styled-components';

const Ul = styled.ul`
  list-style: none;
`;

const H1 = styled.h1`
  font-size: ${props => props.theme.blog.list.header.fontSize};
  margin-top: ${props => props.theme.blog.list.header.marginTop};
  text-align: center;
  overflow: hidden;
`;

const PostList = ({ posts }) => {
  return (
    <section className="post-list">
      <header>
        <H1>Posts</H1>
      </header>
      <nav>
        <Ul>
          {posts.map(post =>
            <PostListItem post={post} />
          )}
        </Ul>
      </nav>
    </section>
  );
};

PostList.propTypes = {
  posts: PropTypes.array
};

export default PostList;
