import React from 'react';
import PropTypes from 'proptypes';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const Time = styled((props) => {
  return (
    <time {...props} dateTime={props.date || new Date()}>
      {
        props.date
          ? (
            <FormattedDate
              value={new Date(props.date)}
              month="numeric"
              year="numeric"
            />
          )
          : (
            <FormattedMessage
              id="resume.jobsAndClients.date.actual"
            />
          )
      }
    </time>
  );
})`
  line-height: 1.2;
  display: inline-block;

  &:last-of-type:before {
    content: '>';
    padding-left: ${({ theme }) => theme.scale(-4)};
    padding-right: ${({ theme }) => theme.scale(-4)};
  }
`;

Time.propTypes = {
  date: PropTypes.string
};

const H3 = styled.h3`
  font-size: ${({ theme }) => theme.scale(3)};
`;

const Li = styled.li`
  margin-top: ${({ theme }) => theme.scale(0)};
  margin-bottom: ${({ theme }) => theme.scale(0)};

  padding-top: ${({ theme }) => theme.scale(0)};
  padding-bottom: ${({ theme }) => theme.scale(0)};
`;

const JobsAndClients = (props) => {
  return (
    <Li>
      <section>
        <header>
          <Time date={props.date.start} />
          <Time date={props.date.end} />
          <H3>{props.name}</H3>
        </header>
      </section>
    </Li>
  );
};

JobsAndClients.propTypes = {
  date: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired
};

export default JobsAndClients;
