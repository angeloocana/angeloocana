import React from 'react';
import PropTypes from 'proptypes';
import ResumeContainer from './ResumeContainer';
import {FormattedMessage} from 'react-intl';
import H2 from '../H2';

const JobsAndClientsPage = (props) => {
  const { menu } = props.data.site.siteMetadata.resume;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/jobs-and-clients/"
    >
      <header>
        <H2>
          <FormattedMessage id="resume.jobsAndClients" />
        </H2>
      </header>
    </ResumeContainer>
  );
};

JobsAndClientsPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default JobsAndClientsPage;
