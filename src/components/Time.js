import React from 'react';
import PropTypes from 'proptypes';
import moment from 'moment';

const getLocale = (langKey) => {
  switch (langKey) {
  case 'en': return 'en-ca';
  case 'fr': return 'fr-ca';
  case 'pt': return 'pt-br';
  default: return langKey;
  }
};

const Time = (props) => {
  const format = props.format || 'LL';
  const langKey = getLocale(props.langKey);
  moment.locale(langKey);

  return (
    <time {...props}>
      {moment(props.date).format(format)}
    </time>
  );
};

Time.propTypes = {
  date: PropTypes.string,
  langKey: PropTypes.string,
  format: PropTypes.string
};

export default Time;
