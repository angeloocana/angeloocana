import React from 'react';
import PropTypes from 'proptypes';
import Link from '../components/Link';
import graphql from 'graphql';
import styled from 'styled-components';

const Li = styled.li`
  padding: ${props => props.theme.blog.list.item.padding};
  margin: ${props => props.theme.blog.list.item.margin};  

  &:hover {
    background-color: ${props => props.theme.blog.list.item.hover.backgroundColor};
    border-radius: ${props => props.theme.borderRadius};
  }
`;

const Header = styled.header`
  padding-bottom: 0;
  font-size: ${props => props.theme.blog.list.item.header.fontSize};
`;

const Time = styled.time`
  font-size: ${props => props.theme.blog.list.item.header.time.fontSize};
  font-style: italic;
  color: ${props => props.theme.blog.list.item.header.time.color};
  width: 100%;
  display: block;
`;

const P = styled.p`
  font-size: ${props => props.theme.blog.list.item.p.fontSize};
  margin: ${props => props.theme.blog.list.item.p.margin};
  padding: ${props => props.theme.blog.list.item.p.padding};
`;

const getToLink = (post) =>
  post.node.fields.path || post.node.fields.slug;

const PostListItem = ({ post }) => {
  return (
    <Li key={post.node.fields.slug}>
      <Link to={getToLink(post)}>
        <Header>
          <Time pubdate>{post.node.frontmatter.date}</Time>
          {post.node.frontmatter.title}
        </Header>
        <P>{post.node.excerpt}</P>
      </Link>
    </Li>
  );
};

PostListItem.propTypes = {
  post: PropTypes.object
};

export default PostListItem;

export const pageQueryTest = graphql`
  fragment postListItem on MarkdownRemark {
    frontmatter{
      title,
      tags,
      date
    },
    fields{
      slug,
      tagSlugs
    },
    excerpt 
  }
`;
