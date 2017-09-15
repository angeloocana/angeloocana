import React from 'react';
import PropTypes from 'proptypes';
import ResumeContainer from './ResumeContainer';
import { FormattedMessage } from 'react-intl';
import H2 from '../H2';
import JobsAndClient from './JobsAndClient';

const JobsAndClientsPage = (props) => {
  const { menu, jobsAndClients } = props.data.site.siteMetadata.resume;

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
      <ul>
        {
          jobsAndClients.map(job => (
            <JobsAndClient {...job} />
          ))
        }
      </ul>
    </ResumeContainer>
  );
};

JobsAndClientsPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default JobsAndClientsPage;
