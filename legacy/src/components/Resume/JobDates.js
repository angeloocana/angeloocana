import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import CalendarNoStyle from 'react-icons/lib/fa/calendar';

const Time = styled.time`
  display: inline-block;

  &:last-of-type:before {
    content: '-';
    padding-left: ${({ theme }) => theme.scale(-4)};
    padding-right: ${({ theme }) => theme.scale(-4)};
  }
`;

const DateLabel = (props) => {
  return props.date
    ? (
      <FormattedDate
        value={new Date(props.date)}
        month="numeric"
        year="numeric"
        tagName="time"
      >
        {(txt) => (
          <Time {...props} dateTime={props.date || new Date()}>
            {txt}
          </Time>
        )}
      </FormattedDate>
    )
    : (
      <FormattedMessage
        id="resume.jobsAndClients.date.actual"
        tagName="time"
        dateTime={props.date || new Date()}
      >
        {(txt) => (
          <Time {...props} dateTime={props.date || new Date()}>
            {txt}
          </Time>
        )}
      </FormattedMessage>
    );
};

DateLabel.propTypes = {
  date: PropTypes.string
};

const CalendarIcon = styled(CalendarNoStyle)`
  padding-right: ${({ theme }) => theme.scale(-4)};
  margin-top: -${({ theme }) => theme.scale(-8)};
`;

const JobDates = ({ start, end }) => {
  return (
    <div>
      <CalendarIcon />
      <DateLabel date={start} />
      <DateLabel date={end} />
    </div>
  );
};

JobDates.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string
};

export default JobDates;
