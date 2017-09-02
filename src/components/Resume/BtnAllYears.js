import React from 'react';
import PropTypes from 'proptypes';
import { Label } from './Year';
import styled from 'styled-components';

const Div = styled.div`
  display: block;
  margin: auto;
  text-align: center;
`;

const BtnAllYears = (props) => {
  return (
    <Div>
      <Label checked={props.selected}>
        <input
          type="checkbox"
          onChange={props.selectAllYears}
          checked={props.selected}
        />
        {props.i18n.selectAllYears}
      </Label>
    </Div>
  );
};

BtnAllYears.propTypes = {
  selectAllYears: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  i18n: PropTypes.shape({
    selectAllYears: PropTypes.string.isRequired
  })
};

export default BtnAllYears;
