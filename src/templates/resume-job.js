import React from 'react';
import JobPage from '../components/Resume/JobPage';
import graphql from 'graphql';

const JobRoute = (props) => (<JobPage {...props} />);

export default JobRoute;

export const pageQuery = graphql`
  query ResumeJob {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }        
        }
      }
    }
  }
`;
