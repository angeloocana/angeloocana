import React from 'react';
import PropTypes from 'proptypes';
import Job from '../components/Resume/Job';

const JobsAndClientsRoute = (props) => {
  const {job} = props.pathContext;
  return (
    <Job job={job} />
  );
};

JobsAndClientsRoute.propTypes = {
  pathContext: PropTypes.shape({
    job: PropTypes.object.isRequired
  }).isRequired
};

export default JobsAndClientsRoute;
