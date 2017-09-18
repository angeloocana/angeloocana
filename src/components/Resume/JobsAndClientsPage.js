import React from 'react';
import PropTypes from 'prop-types';
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
        <FormattedMessage id="resume.jobsAndClients">
          {(txt) => (
            <H2>
              {txt}
            </H2>
          )}
        </FormattedMessage>
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
