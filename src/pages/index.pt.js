import React from 'react';
import Index from '../components/Index';
import graphql from 'graphql';
import {
  yearsMsg, 
  getLevelMsg, 
  technologiesTitle
} from './resume/index.pt';

const btnMorePostsMsg = 'Ver mais posts interessantes >>';

const btnResumeMsg = 'Ver todas tecnologias +';

export default (props) => <Index
  {...props}
  yearsMsg={yearsMsg}
  getLevelMsg={getLevelMsg}
  btnMorePostsMsg={btnMorePostsMsg}
  btnResumeMsg={btnResumeMsg}
  technologiesTitle={technologiesTitle}
/>;

export const pageQuery = graphql`
  query IndexPtQuery {
    allMarkdownRemark(
      limit: 3
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
