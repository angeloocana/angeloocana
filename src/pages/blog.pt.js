import React from 'react';
import Blog from './_blog';
import graphql from 'graphql';

const i18n = {
  title: 'Posts'
};

export default (props) => <Blog i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query BlogPtQuery {
   allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } },
        fields: { langKey: { regex: "/(pt|any)/" } }
      },
    ) {
      edges {
        node{
          frontmatter{
            title,
            tags,
            date
          },
          fields{
            slug,
            langKey,
            tagSlugs{
              tag,
              link
            }
          },
          excerpt
        }
      }
    }
  }
`;
