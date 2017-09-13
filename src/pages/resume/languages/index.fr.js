import React from 'react';
import LanguagesPage from '../../../components/Resume/LanguagesPage';
import graphql from 'graphql';

export default (props) =>
  <LanguagesPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeLanguagesFr {
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
