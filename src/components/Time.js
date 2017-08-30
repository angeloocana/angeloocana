import React from 'react';
import PropTypes from 'proptypes';
import Moment from 'react-moment';

const Time = (props) => {
  const format = props.format || 'LL';
  return (
    <time {...props}>
      <Moment
        locale={props.langKey}
        format={format}
      >
        {props.date}
      </Moment>
    </time>
  );
};

Time.propTypes = {
  date: PropTypes.string,
  langKey: PropTypes.string,
  format: PropTypes.string
};

export default Time;
