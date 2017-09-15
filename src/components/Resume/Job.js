import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../H1';
import BreadCrumb from '../BreadCrumb';
import { injectIntl } from 'react-intl';
import JobDates from './JobDates';
import styled from 'styled-components';
import Technologies from './Technologies';
import Projects from './Projects';

const Header = styled.header`
  padding-bottom: ${({ theme }) => theme.scale(1)};
`;

const getBreadCrumb = (langKey) => [
  {
    link: `/${langKey}/resume/`,
    label: 'resume'
  },
  {
    link: `/${langKey}/resume/jobs-and-clients/`,
    label: 'resume.jobsAndClients'
  }
];

const Job = ({ job, intl }) => {
  console.log('job', job);

  return (
    <section>
      <Header>
        <BreadCrumb
          items={getBreadCrumb(intl.locale)}
        />
        <H1>{job.name}</H1>
      </Header>
      <JobDates {...job.date} />
      <Projects projects={job.projects} />
      <Technologies technologies={job.technologies} />
    </section>
  );
};

Job.propTypes = {
  job: PropTypes.shape({
    name: PropTypes.string
  }),
  intl: PropTypes.object.isRequired
};

export default injectIntl(Job);
