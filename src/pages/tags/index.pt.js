import React from 'react';
import TagsPageRoute from './_tags';
import graphql from 'graphql';

export default (props) => <TagsPageRoute {...props} />;

export const pageQuery = graphql`
  query TagsPtQuery {
    allMarkdownRemark(
      limit: 2000
      filter: {
        frontmatter: { draft: { ne: true } } ,
        fields: {
          langKey: {eq: "pt"}
        }
      }
    ) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;
