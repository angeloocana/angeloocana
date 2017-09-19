import React from 'react';
import PropTypes from 'prop-types';
import H1 from '../H1';
import { injectIntl, FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';
import JobDates from './JobDates';
import styled from 'styled-components';
import Technologies from './Technologies';
import Projects from './Projects';
import ResumeContainer from './ResumeContainer';

const Header = styled.header`
  padding-bottom: ${({ theme }) => theme.scale(1)};
`;

const getBreadCrumb = (langKey) => [
  {
    link: `/${langKey}/resume/jobs-and-clients/`,
    label: 'resume.jobsAndClients'
  }
];

const Job = (props) => {
  const {job} = props.pathContext;
  const {menu} = props.data.site.siteMetadata.resume;

  const description = job.description;
  const langKey = props.intl.locale;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/jobs-and-clients/"
      breadCrumb={getBreadCrumb(langKey)}
    >
      <FormattedMessage id="resume">
        {(resume) => (
          <Helmet
            title={`${resume} - ${job.name}`}
            meta={[{ name: 'description', content: description }]}
          />
        )}
      </FormattedMessage>
      <Header>
        <H1>{job.name}</H1>
      </Header>
      <JobDates {...job.date} />
      <Projects
        projects={job.projects}
        langKey={langKey}
        job={job}
      />
      <Technologies technologies={job.technologies} />
    </ResumeContainer>
  );
};

Job.propTypes = {  
  intl: PropTypes.object.isRequired,
  pathContext: PropTypes.shape({
    job: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  data: PropTypes.object.isRequired
};

export default injectIntl(Job);
