import React from 'react';
import PropTypes from 'prop-types';
import graphql from 'graphql';
import Link from 'gatsby-link';
import styled from 'styled-components';
import PostList from '../components/PostList';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';

const Header = styled.header`
  text-align: center;
  font-size: ${({ theme }) => theme.scale(1)};
`;

const TagName = styled.span`
  font-size: ${({ theme }) => theme.scale(5)};
  display: block;
  text-align: center;
`;

const AllTagsLink = styled(Link)`
  text-align: center;
  padding: ${({ theme }) => theme.scale(1)} 0;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.yellow};
  font-size: ${({ theme }) => theme.scale(0)};
  display: block;
  position: relative;
  text-decoration: underline;
  transition: 0.3s;

  &:hover {
      color: ${({ theme }) => theme.colors.white};
      transition: 0.3s;
  }
`;

const TagRoute = ({ data, pathContext }) => {
  const posts = data.allMarkdownRemark.edges.map(p => p.node);

  const allTagsLink = (
    <FormattedMessage id="tags.allTagsLink" >
      {(txt) => (
        <AllTagsLink
          to={`/${pathContext.langKey}/tags/`}
        >
          {txt}
        </AllTagsLink>
      )}
    </FormattedMessage>
  );

  return (
    <section>
      <Header>
        <FormattedMessage id="tags">
          {(txt) => (
            <Helmet
              title={`${pathContext.tag} | ${txt}`}
              meta={[{ name: 'description', content: txt }]}
            />
          )}
        </FormattedMessage>
        <FormattedMessage
          id="tags.nPostsTaggedWith"
          values={{ nPosts: data.allMarkdownRemark.totalCount }}
        />
        <TagName>“{pathContext.tag}”</TagName>
        {allTagsLink}
      </Header>
      <PostList
        posts={posts}
      />
      <footer>
        {allTagsLink}
      </footer>
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
        draft: {ne: true}
      },
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
          langKey
        },
        excerpt
      }
    }
  }
  }
`;
