import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export default (props) =>
  <EducationsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeEducationsPt {
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
              pt
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
