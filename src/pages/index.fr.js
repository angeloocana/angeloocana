import React from 'react';
import Index from './_index';
import graphql from 'graphql';
import {
  yearsMsg, 
  getLevelMsg, 
  technologiesTitle
} from './resume/index.fr';

const btnMorePostsMsg = `Voir d'autres messages intéressants >>`;

const btnResumeMsg = `Voir toutes les technologies +`;

export default (props) => <Index
  {...props}
  yearsMsg={yearsMsg}
  getLevelMsg={getLevelMsg}
  btnMorePostsMsg={btnMorePostsMsg}
  btnResumeMsg={btnResumeMsg}
  technologiesTitle={technologiesTitle}
/>;

export const pageQuery = graphql`
  query IndexFrQuery {
    allMarkdownRemark(
      limit: 3
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } },
        fields: { langKey: { regex: "/(fr|any)/" } }
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
