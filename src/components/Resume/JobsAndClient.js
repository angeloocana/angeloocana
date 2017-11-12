import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import styled from 'styled-components';
import { getJobUrl } from '../../data/resume/getJobUrl';
import Link from '../Link';
import JobDates from './JobDates';

const H3 = styled.h3`
  font-size: ${({ theme }) => theme.scale(3)};
  padding-top: ${({ theme }) => theme.scale(-4)};
`;

const Li = styled.li`
  margin-top: ${({ theme }) => theme.scale(0)};
  margin-bottom: ${({ theme }) => theme.scale(0)};

  padding-top: ${({ theme }) => theme.scale(0)};
  padding-bottom: ${({ theme }) => theme.scale(0)};
`;

const JobsAndClients = (props) => {
  const url = getJobUrl(props.intl.locale, props.slug);

  return (
    <Li>
      <Link to={url}>
        <section>
          <header>
            <JobDates {...props.date} />
            <H3>{props.name}</H3>
          </header>
        </section>
      </Link>
    </Li>
  );
};

JobsAndClients.propTypes = {
  date: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired
};

export default injectIntl(JobsAndClients);
