import React from 'react';
import Index from '../components/Index';
import graphql from 'graphql';
import { i18n as resume } from './resume/index.fr';

export const i18n = {
  posts: {
    title: 'Articles',
    btnMorePostsMsg: `Voir d'autres messages intéressants >>`,
  },  
  btnResumeMsg: `Voir toutes les technologies +`,
  technologies: resume.technologies
};

export default (props) => <Index
  {...props}
  i18n={i18n}
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
