import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Link from 'gatsby-link';
import styled from 'styled-components';
import PostList from '../components/PostList';
import { getI18nBase } from '../i18n/langs';
import { FormattedMessage } from 'react-intl';

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

const getI18n = getI18nBase({
  'en': {
    allTags: 'Browse all tags',
    nPostsTaggedWith: `{nPosts, number} {nPosts, plural,
      one {post}
      other {posts}
    } tagged with`,
    and: 'and'
  },
  'pt': {
    allTags: 'Ver todas as tags',
    nPostsTaggedWith: `{nPosts, number} {nPosts, plural,
      one {post}
      other {posts}
    } com a tag`,
    and: 'e'
  },
  'fr': {
    allTags: 'Parcourir tous les tags',
    nPostsTaggedWith: `{nPosts, number} {nPosts, plural,
      one {article}
      other {articles}
    } avec l'étiquette`,
    and: 'et'
  }
});

const TagRoute = ({ data, pathContext }) => {
  const posts = data.allMarkdownRemark.edges.map(p => p.node);
  const i18n = getI18n(pathContext.langKey);

  const allTagsLink = (
    <AllTagsLink
      to={`/${pathContext.langKey}/tags/`}
    >
      {i18n.allTags}
    </AllTagsLink>
  );

  return (
    <section>
      <Header>
        <FormattedMessage
          id="tag-page.n-posts-tagged-with"
          defaultMessage={i18n.nPostsTaggedWith}
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
        },
        excerpt
      }
    }
  }
  }
`;
