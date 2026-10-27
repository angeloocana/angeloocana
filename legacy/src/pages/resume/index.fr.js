import React from 'react';
import TechnologiesPage from '../../components/Resume/TechnologiesPage';
import graphql from 'graphql';

export default (props) =>
  <TechnologiesPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeTechnologiesFr {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }
          technologies {
            name
            tags
            level
            years
            img
            needWhiteBg
            link
          }
        }
      }
    }
  }
`;
