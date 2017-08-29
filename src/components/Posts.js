import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import Link from './Link';
import PostList from './PostList';

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

const Posts = (props) => {
  return (
    <section className="post-list">
      <header>
        <Link to={`/${props.currentLangKey}/blog/`}>
          <H1>{getPostTitle()[props.currentLangKey]}</H1>
        </Link>
      </header>
      <PostList {...props} />
    </section>
  );
};

Posts.propTypes = {
  posts: PropTypes.array,
  currentLangKey: PropTypes.string
};

export default Posts;
