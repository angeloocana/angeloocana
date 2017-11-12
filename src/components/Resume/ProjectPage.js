import React from 'react';
import PropTypes from 'prop-types';
import H1 from '../H1';
import ResumeContainer from './ResumeContainer';
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
    link: `/${langKey}/resume/jobs-and-clients/`,
    label: 'resume.jobsAndClients'
  },
  {
    link: `/${langKey}/resume/jobs-and-clients${job.slug}`,
    label: job.name
  }
];

const Dl = styled.dl`
  margin-top: 1rem;

  dt, dd {
    display: inline-block;
  }

  dt: {
  }

  dt:after {
    content: ': ';
    margin-right: ${({theme}) => theme.scale(-2)};
  }
`;

const getLink = (project) => project.link
  ? (
    <Dl>
      <FormattedMessage id="resume.project.link" tagName="dt" />
      <dd>
        <A href={project.link} target="_blank">
          {project.link}
        </A>
      </dd>
    </Dl>
  )
  : null;

const getNYears = (years) => head(years) - last(years) + 1;

const getYears = (years) => {
  const firstYear = head(years);
  const lastYear = last(years);

  const txt = firstYear === lastYear
    ? firstYear
    : `${firstYear}/${lastYear}`;

  return [
    <Dl>
      <FormattedMessage
        id="resume.project.years"
        tagName="dt"
        values={{ nYears: getNYears(years) }}
      />
      <dd>{txt}</dd>
    </Dl>
  ];
};

const getTechnologies = (project) =>
  project.technologies
    ? (<Technologies technologies={project.technologies} />)
    : null;

const ProjectPage = (props) => {
  const { job, project } = props.pathContext;
  const { menu } = props.data.site.siteMetadata.resume;
  const description = project.description;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/jobs-and-clients/"
      breadCrumb={getBreadCrumb(props.intl.locale, job)}
    >
      <FormattedMessage id="resume">
        {(resume) => (
          <Helmet
            title={`${resume} - ${job.name} - ${project.name}`}
            meta={[{ name: 'description', content: description }]}
          />
        )}
      </FormattedMessage>
      <Header>
        <H1>{project.name}</H1>
      </Header>
      {getLink(project)}
      {getYears(project.years)}
      {getTechnologies(project)}
    </ResumeContainer>
  );
};

ProjectPage.propTypes = {
  intl: PropTypes.object.isRequired,
  pathContext: PropTypes.shape({
    project: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      technologies: PropTypes.array.isRequired
    }).isRequired,
    job: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired
    }).isRequired,
  }).isRequired,
  data: PropTypes.object.isRequired
};

export default injectIntl(ProjectPage);
