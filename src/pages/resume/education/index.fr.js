import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export default (props) =>
  <EducationsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeEducationsFr {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }
          educations {
            name
            subject {
              fr
            }
            needWhiteBg
            link
            fullName
            years
            img
          }
        }
      }
    }
  }
`;
