import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export default (props) =>
  <EducationsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeJobsAndClientsPt {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }
          jobsAndClients{
            name
            date {
              start
              end
            },
            img,
            link,
            projects {
              name
              description
              link
            },
            technologies {
              name
              level
              img
              link
              needWhiteBg
            },
            needWhiteBg
          }
        }
      }
    }
  }
`;
