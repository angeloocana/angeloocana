import React from 'react';
import Index from '../components/Index';
import graphql from 'graphql';
import {
  yearsMsg, 
  getLevelMsg, 
  technologiesTitle
} from './resume/index.en';

export const btnMorePostsMsg = 'See more interesting posts >>';

export const btnResumeMsg = 'See all technologies +';

export default (props) => <Index
  {...props}
  yearsMsg={yearsMsg}
  getLevelMsg={getLevelMsg}
  btnMorePostsMsg={btnMorePostsMsg}
  btnResumeMsg={btnResumeMsg}
  technologiesTitle={technologiesTitle}
/>;

export const pageQuery = graphql`
  query IndexEnQuery {
    allMarkdownRemark(
      limit: 3
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } },
        fields: { langKey: { regex: "/(en|any)/" } }
      },
    ) {
      edges {
        node{
          frontmatter{
            title,
            date
          },
          fields{
            slug,
            langKey
          },
          excerpt
        }
      }
    }
    site{
      siteMetadata{
        resume{
          technologies{
            name,
            tags,
            level,
            years,
            img
          }
        }
      }
    }
  }
`;
