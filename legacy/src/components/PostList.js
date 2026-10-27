import React from 'react';
import PropTypes from 'prop-types';
import PostListItem from './PostListItem';
import styled from 'styled-components';

const Ul = styled.ul`
  list-style: none;
  margin: ${props => props.theme.blog.list.ul.margin};
  padding: ${props => props.theme.blog.list.ul.padding};
`;

const PostList = (props) => {
  return (
    <nav>
      <Ul>
        {props.posts.map(post =>
          <PostListItem post={post} />
        )}
      </Ul>
    </nav>
  );
};

PostList.propTypes = {
  posts: PropTypes.array
};

export default PostList;
