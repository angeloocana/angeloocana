import React from 'react';
import PropTypes from 'proptypes';
import H2 from '../H2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
// import Link from '../Link';

const Header = styled.header`
  padding-bottom: ${({ theme }) => theme.scale(1)};
`;

const Li = styled.li`  
  padding-top: ${({ theme }) => theme.scale(-2)};
  padding-bottom: ${({ theme }) => theme.scale(-2)};
  display: block;
`;

const Projects = ({ projects }) => {
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
            {/* <Link to={project.link}> */}
            {project.name}
            {/* </Link> */}
          </Li>
        ))}
      </ul>
    </section>
  );
};

Projects.propTypes = {
  projects: PropTypes.array.isRequired
};

export default Projects;
