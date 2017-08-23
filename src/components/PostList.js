import React from 'react';
import PropTypes from 'proptypes';
import PostListItem from './PostListItem';
import styled from 'styled-components';
import Link from './Link';

const Ul = styled.ul`
  list-style: none;
  margin: ${props => props.theme.blog.list.ul.margin};
  padding: ${props => props.theme.blog.list.ul.padding};
`;

const H1 = styled.h1`
  font-size: ${props => props.theme.blog.list.header.fontSize};
  margin: ${props => props.theme.blog.list.header.margin};
  padding: ${props => props.theme.blog.list.header.padding};
  text-align: center;
  overflow: hidden;
`;

const getPostTitle = () => {
  return {
    en: 'Posts',
    pt: 'Posts',
    fr: 'Articles'
  };
};

const PostList = ({ posts, currentLangKey }) => {
  return (
    <section className="post-list">
      <header>
        <Link to={`/${currentLangKey}/blog/`}>
          <H1>{getPostTitle()[currentLangKey]}</H1>
        </Link>
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
  posts: PropTypes.array,
  currentLangKey: PropTypes.string
};

export default PostList;
