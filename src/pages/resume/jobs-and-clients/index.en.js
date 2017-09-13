import React from 'react';
import JobsAndClientsPage from '../../../components/Resume/JobsAndClientsPage';
import graphql from 'graphql';

export default (props) =>
  <JobsAndClientsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeJobsAndClientsEn {
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
