import React from 'react';
import PropTypes from 'proptypes';
import ResumeContainer from './ResumeContainer';

const JobsAndClientsPage = (props) => {
  const { menu } = props.data.site.siteMetadata.resume;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/jobs-and-clients/"
    >
      <div>Jobs and clients</div>
    </ResumeContainer>
  );
};

JobsAndClientsPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default JobsAndClientsPage;
