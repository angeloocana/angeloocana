import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export default (props) =>
  <EducationsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeEducationEn {
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
              en
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
