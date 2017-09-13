import React from 'react';
import PropTypes from 'proptypes';
import { FormattedDate } from 'react-intl';

const Time = (props) => {
  return (
    <time {...props}>
      <FormattedDate
        value={new Date(props.date)}
        month="long"
        day="numeric"
        year="numeric"
      />
    </time>
  );
};

Time.propTypes = {
  date: PropTypes.string,
  langKey: PropTypes.string,
  format: PropTypes.string
};

export default Time;
