import React from 'react';
import PropTypes from 'prop-types';
import H1 from '../H1';
import BreadCrumb from '../BreadCrumb';
import { injectIntl, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import Technologies from './Technologies';
import Helmet from 'react-helmet';

const Header = styled.header`
  padding-bottom: ${({ theme }) => theme.scale(1)};
`;

const getBreadCrumb = (langKey, job) => [
  {
    link: `/${langKey}/resume/`,
    label: 'resume'
  },
  {
    link: `/${langKey}/resume/jobs-and-clients/`,
    label: 'resume.jobsAndClients'
  },
  {
    link: `/${langKey}/resume/jobs-and-clients${job.slug}`,
    label: job.name
  }
];

const ProjectPage = ({ project, job, intl }) => {
  const description = project.description;
  console.log('project: ', project);
  console.log('job', job);

  return (
    <section>
      <FormattedMessage id="resume">
        {(resume) => (
          <Helmet
            title={`${resume} - ${job.name} - ${project.name}`}
            meta={[{ name: 'description', content: description }]}
          />
        )}
      </FormattedMessage>
      <Header>
        <BreadCrumb
          items={getBreadCrumb(intl.locale, job)}
        />
        <H1>{project.name}</H1>
      </Header>
      <Technologies technologies={project.technologies} />
    </section>
  );
};

ProjectPage.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    technologies: PropTypes.array.isRequired
  }),
  job: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired
  }),
  intl: PropTypes.object.isRequired
};

export default injectIntl(ProjectPage);
