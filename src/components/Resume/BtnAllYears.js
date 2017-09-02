import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';

const Input = styled.button`
  background-color: ${({theme}) => theme.colors.white};
  padding: 1rem;
  margin: ${({theme}) => theme.scale(2)} auto;
  color: ${({theme}) => theme.colors.black};
  border-radius: 0.2rem;
  text-decoration: none;
  display: table;
  border: none;
  transition: 0.3s;

  &:hover {
      background-color: ${props => props.theme.colors.blackShades[0]};
      color: ${({theme}) => theme.colors.yellow};
      transition: 0.3s;
  }
`;

const BtnAllYears = (props) => {
  return (
    <Input type="button" onClick={props.selectAllYears}>
      {props.i18n.selectAllYears}
    </Input>
  );
};

BtnAllYears.propTypes = {
  selectAllYears: PropTypes.func,
  i18n: PropTypes.shape({
    selectAllYears: PropTypes.string
  })
};

export default BtnAllYears;
