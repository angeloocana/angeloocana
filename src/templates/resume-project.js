import React from 'react';
import PropTypes from 'prop-types';
import ProjectPage from '../components/Resume/ProjectPage';

const ProjectRoute = (props) => {
  const { job, project } = props.pathContext;
  return (<ProjectPage job={job} project={project} />);
};

ProjectRoute.propTypes = {
  pathContext: PropTypes.shape({
    project: PropTypes.object.isRequired
  }).isRequired
};

export default ProjectRoute;
