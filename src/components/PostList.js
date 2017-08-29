import React from 'react';
import PropTypes from 'proptypes';
import PostListItem from './PostListItem';
import styled from 'styled-components';

const Ul = styled.ul`
  list-style: none;
  margin: ${props => props.theme.blog.list.ul.margin};
  padding: ${props => props.theme.blog.list.ul.padding};
`;

const PostList = ({ posts, currentLangKey }) => {
  return (
    <nav>
      <Ul>
        {posts.map(post =>
          <PostListItem post={post} />
        )}
      </Ul>
    </nav>
  );
};

PostList.propTypes = {
  posts: PropTypes.array,
  currentLangKey: PropTypes.string
};

export default PostList;
