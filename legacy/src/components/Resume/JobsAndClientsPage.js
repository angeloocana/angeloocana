import React from 'react';
import PropTypes from 'prop-types';
import ResumeContainer from './ResumeContainer';
import { FormattedMessage } from 'react-intl';
import H2 from '../H2';
import JobsAndClient from './JobsAndClient';
import Helmet from 'react-helmet';

const JobsAndClientsPage = (props) => {
  const { menu, jobsAndClients } = props.data.site.siteMetadata.resume;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/jobs-and-clients/"
    >
      <FormattedMessage id="resume.jobsAndClients">
        {(txt) => (
          <header>
            <Helmet
              title={txt}
              meta={[{ name: 'description', content: txt }]}
            />
            <H2>
              {txt}
            </H2>
          </header>
        )}
      </FormattedMessage>
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
