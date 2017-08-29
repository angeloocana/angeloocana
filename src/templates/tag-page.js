import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from '../components/Link';
import CleanLink from 'gatsby-link';
import styled from 'styled-components';

const Header = styled.header`
  text-align: center;
  font-size: ${({theme}) => theme.scale(1)};
`;

const TagName = styled.span`
  font-size: ${({theme}) => theme.scale(5)};
  display: block;
  text-align: center;
`;

const Nav = styled.nav`
  margin-top: ${({theme}) => theme.scale(-1)};
`;

const Li = styled.li`
  text-align: center;
  font-size: ${({theme}) => theme.scale(1)};
  padding: ${({theme}) => theme.scale(-1)} 0;
`;

const Footer = styled.footer`
  text-align: center;
  padding: ${({theme}) => theme.scale(1)} 0;
`;

const BrowseAllLink = styled(CleanLink)`
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
  const postLinks = posts.map(post => {
    return (
      <Li key={post.node.fields.slug}>
        <Link to={post.node.fields.slug}>
          {post.node.frontmatter.title}
        </Link>
      </Li>
    );
  });

  return (
    <section>
      <Header>
        {data.allMarkdownRemark.totalCount} posts tagged with
        <TagName>“{pathContext.tag}”</TagName>
      </Header>
      <Nav>
        <ul>
          {postLinks}
        </ul>
      </Nav>
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
        fields {
          slug
          langKey
        }
        frontmatter {
          tags
          title
        }
      }
    }
  }
  }
`;
