import React from 'react';
import Index from '../components/Index';
import graphql from 'graphql';
import { i18n as resume } from './resume/index.en';

export const i18n = {
  posts: {
    title: 'Posts',
    btnMorePostsMsg: 'See more interesting posts >>',
  },
  btnResumeMsg: 'See all technologies +',
  technologies: resume.technologies
};

export default (props) => <Index
  {...props}
  i18n={i18n}
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
