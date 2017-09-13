import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const Label = styled.label`
  cursor: 'pointer';
  padding: ${({ theme }) => theme.scale(-3)} 1rem;
  display: inline-block;
  font-size: ${({ theme }) => theme.scale(0)};
  min-width: ${({ theme }) => theme.scale(8)};
  border-radius: 2rem;
  margin: ${({ theme }) => theme.scale(-6)};
  background-color: ${({ theme }) => theme.colors.blackShades[0]};
  text-align: center;

  ${(props) => props.checked
    ? `
      font-weight: bold;
      color:  ${props.theme.colors.black};
      background-color: ${props.theme.colors.white};
    `
    : ``}
`;

const Input = styled.input`
    cursor: 'pointer';
    padding: 0;
    margin: 0 0.2rem 0 0;
`;

class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    value: PropTypes.any,
    check: PropTypes.func.isRequired,
    checked: PropTypes.bool.isRequired
  }

  onChange = (e) => {
    this.props.check(this.props.value);
  }

  render() {
    return (
      <Label checked={this.props.checked}>
        <Input
          type="checkbox"
          onChange={this.onChange}
          onClick={this.onClick}
          checked={this.props.checked}
        />
        <FormattedMessage 
          id={this.props.label}
          defaultMessage={this.props.label}
        />
      </Label>
    );
  }
}

export default Checkbox;
