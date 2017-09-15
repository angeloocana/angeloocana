import React from 'react';
import JobsAndClientsPage from '../../../components/Resume/JobsAndClientsPage';
import graphql from 'graphql';

export default (props) =>
  <JobsAndClientsPage
    {...props}
  />;

export const pageQuery = graphql`
  query ResumeJobsAndClientsFr {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }
          jobsAndClients{
            name
            slug
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
