import React from 'react';
import PropTypes from 'proptypes';

const BtnAllYears = (props) => {
  return (
    <input type="button" onClick={props.selectAllYears}>
      {props.i18n.selectAllYears}
    </input>
  );
};

BtnAllYears.propTypes = {
  selectAllYears: PropTypes.func,
  i18n: PropTypes.shape({
    selectAllYears: PropTypes.string
  })
};

export default BtnAllYears;
