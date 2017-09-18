import React from 'react';
import PropTypes from 'prop-types';
import H2 from '../H2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import Link from '../Link';
import {getJobUrl} from '../../data/resume/getJobUrl';

const Header = styled.header`
  padding-bottom: ${({ theme }) => theme.scale(1)};
`;

const Li = styled.li`  
  padding-top: ${({ theme }) => theme.scale(-2)};
  padding-bottom: ${({ theme }) => theme.scale(-2)};
  display: block;
`;

const Projects = ({ projects, job, langKey }) => {
  return (
    <section>
      <Header>
        <FormattedMessage id="resume.jobsAndClients.projects">
          {(txt) => (
            <H2>
              {txt}
            </H2>
          )}
        </FormattedMessage>
      </Header>
      <ul>
        {projects.map(project => (
          <Li>
            <Link to={getJobUrl(langKey, job.slug, project.slug)}>
              {project.name}
            </Link>
          </Li>
        ))}
      </ul>
    </section>
  );
};

Projects.propTypes = {
  projects: PropTypes.array.isRequired,
  job: PropTypes.shape({
    slug: PropTypes.string.isRequired
  }).isRequired,
  langKey: PropTypes.string.isRequired
};

export default Projects;
