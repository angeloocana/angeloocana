import React from 'react';
import PropTypes from 'prop-types';
import JobPage from '../components/Resume/JobPage';

const JobRoute = (props) => {
  const {job} = props.pathContext;
  return (
    <JobPage job={job} />
  );
};

JobRoute.propTypes = {
  pathContext: PropTypes.shape({
    job: PropTypes.object.isRequired
  }).isRequired
};

export default JobRoute;
