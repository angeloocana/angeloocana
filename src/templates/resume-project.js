import React from 'react';
import PropTypes from 'prop-types';
// import Job from '../../../components/Resume/Job';

const ProjectRoute = (props) => {
  const { project } = props.pathContext;
  return (
    <div>
      {project.name}
    </div>
  );
};

ProjectRoute.propTypes = {
  pathContext: PropTypes.shape({
    project: PropTypes.object.isRequired
  }).isRequired
};

export default ProjectRoute;
