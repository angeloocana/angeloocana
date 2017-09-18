import React from 'react';
import PropTypes from 'prop-types';
import Link from '../components/Link';
import styled from 'styled-components';
import CleanTime from '../components/Time';

const Li = styled.li`
  padding: ${props => props.theme.blog.list.item.padding};
  margin: ${props => props.theme.blog.list.item.margin};
  transition: 0.3s;

  &:hover {
    background-color: ${props => props.theme.blog.list.item.hover.backgroundColor};
    border-radius: ${props => props.theme.borderRadius};
    transition: 0.3s;
  }
`;

const Header = styled.header`
  padding: 0;
  font-size: ${props => props.theme.blog.list.item.header.fontSize};
  line-height: ${props => props.theme.blog.list.item.header.lineHeight};
`;

const Time = styled(CleanTime)`
  font-size: ${props => props.theme.blog.list.item.header.time.fontSize};
  font-weight: bold;
  color: ${props => props.theme.blog.list.item.header.time.color};
  width: 100%;
  display: block;
  line-height: 1.2;
`;

const P = styled.p`
  font-size: ${props => props.theme.blog.list.item.p.fontSize};
  margin: ${props => props.theme.blog.list.item.p.margin};
  padding: ${props => props.theme.blog.list.item.p.padding};
  line-height: ${props => props.theme.blog.list.item.p.lineHeight};
`;

const PostListItem = ({ post }) => {
  return (
    <Li key={post.fields.slug}>
      <Link to={post.fields.slug}>
        <Header>
          <Time
            pubdate
            langKey={post.fields.langKey}
            date={post.frontmatter.date}
          />
          {post.frontmatter.title}
        </Header>
        <P>{post.excerpt}</P>
      </Link>
    </Li>
  );
};

PostListItem.propTypes = {
  post: PropTypes.shape({
    fields: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      langKey: PropTypes.string.isRequired
    }),
    frontmatter: PropTypes.shape({
      title: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired
    }),
    excerpt: PropTypes.string.isRequired
  })
};

export default PostListItem;
