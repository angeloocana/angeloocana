import React from 'react';
import ProjectPage from '../components/Resume/ProjectPage';
import graphql from 'graphql';

const ProjectRoute = (props) => (<ProjectPage {...props} />);

export default ProjectRoute;

export const pageQuery = graphql`
  query ResumeJobProject {
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
