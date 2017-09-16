import React from 'react';
import PropTypes from 'proptypes';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import CalendarNoStyle from 'react-icons/lib/fa/calendar';

const Time = styled((props) => {
  return props.date
    ? (
      <FormattedDate
        value={new Date(props.date)}
        month="numeric"
        year="numeric"
        tagName="time"
        dateTime={props.date || new Date()}
      />
    )
    : (
      <FormattedMessage
        id="resume.jobsAndClients.date.actual"
        tagName="time"
        dateTime={props.date || new Date()}
      />
    );
})`
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

const CalendarIcon = styled(CalendarNoStyle)`
  padding-right: ${({ theme }) => theme.scale(-4)};
`;

const JobDates = ({ start, end }) => {
  return (
    <div>
      <CalendarIcon />
      <Time date={start} />
      <Time date={end} />
    </div>
  );
};

JobDates.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string
};

export default JobDates;
