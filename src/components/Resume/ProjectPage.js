import React from 'react';
import PropTypes from 'prop-types';
import H1 from '../H1';
import BreadCrumb from '../BreadCrumb';
import { injectIntl, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import Technologies from './Technologies';
import Helmet from 'react-helmet';
import A from '../A';
import { head, last } from 'ramda';

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

const getLink = (project) => project.link
  ? (
    <div>
      <FormattedMessage id="resume.project.link" tagName="label" />
      {': '}
      <A href={project.link} target="_blank">
        {project.link}
      </A>
    </div>
  )
  : null;

const getNYears = (years) => head(years) - last(years) + 1;

const getYears = (years) => {
  const firstYear = head(years);
  const lastYear = last(years);

  const txt = firstYear === lastYear
    ? firstYear
    : `${firstYear}/${lastYear}`;

  return (
    <div>
      <FormattedMessage
        id="resume.project.years"
        tagName="label"
        values={{ nYears: getNYears(years) }}
      />
      {': '}
      <span>
        {txt}
      </span>
    </div>
  );
};

const getTechnologies = (project) =>
  project.technologies
    ? (<Technologies technologies={project.technologies} />)
    : null;

const ProjectPage = ({ project, job, intl }) => {
  const description = project.description;

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
      {getLink(project)}
      {getYears(project.years)}
      {getTechnologies(project)}
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
