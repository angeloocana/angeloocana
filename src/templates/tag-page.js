import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from 'gatsby-link';
import styled from 'styled-components';
import PostList from '../components/PostList';

const Header = styled.header`
  text-align: center;
  font-size: ${({theme}) => theme.scale(1)};
`;

const TagName = styled.span`
  font-size: ${({theme}) => theme.scale(5)};
  display: block;
  text-align: center;
`;

const Footer = styled.footer`
  text-align: center;
  padding: ${({theme}) => theme.scale(1)} 0;
`;

const BrowseAllLink = styled(Link)`
  font-weight: bold;
  color: ${({theme}) => theme.colors.yellow};
  display: inline-block;
  position: relative;
  text-decoration: underline;
  transition: 0.2s;

  &:hover {
      color: ${({theme}) => theme.colors.white};
  }
`;

const TagRoute = ({data, pathContext}) => {
  const posts = data.allMarkdownRemark.edges;
  const allTagsLink = `/${pathContext.langKey}/tags/`;

  return (
    <section>
      <Header>
        {data.allMarkdownRemark.totalCount} posts tagged with
        <TagName>“{pathContext.tag}”</TagName>
      </Header>
      <PostList posts={posts} currentLangKey={pathContext.langKey} />
      <Footer>
        <BrowseAllLink to={allTagsLink}>Browse all tags</BrowseAllLink>
      </Footer>
    </section>
  );
};

TagRoute.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default TagRoute;

export const pageQuery = graphql`
  query TagPage($tag: String, $langKey: String) {
  allMarkdownRemark(limit: 1000,
    sort: {fields: [frontmatter___date], order: DESC},
    filter: {
      frontmatter: {
        tags: {in: [$tag]},
        draft: {ne: true}},
      fields: {
        langKey: {eq: $langKey}
      }
    }) {
    totalCount
    edges {
      node {
        frontmatter{
          title,
          date
        },
        fields{
          slug
        },
        excerpt
      }
    }
  }
  }
`;
