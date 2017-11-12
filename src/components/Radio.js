import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const Label = styled.label`
  cursor: 'pointer';
  padding-top: ${({ theme }) => theme.scale(-1)};
  padding-bottom: ${({ theme }) => theme.scale(0)};
  padding-left: ${({ theme }) => theme.scale(-1)};
  padding-right: ${({ theme }) => theme.scale(0)};

  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.scale(0)};
  margin-left: 0;
  margin-right: 0;

  display: inline-block;
  font-size: ${({ theme }) => theme.scale(-1)};
  border-radius: 0.2rem;
  text-align: center;
  transition: 0.2s;

  ${(props) => props.checked
    ? `
      color:  ${props.theme.colors.black};
      background-color: ${props.theme.colors.white};
      font-size: ${props.theme.scale(0)};
    `
    : ``}

  &:hover {
    transition: 0.2s;
    color:  ${({ theme }) => theme.colors.black};
    background-color: ${({ theme }) => theme.colors.white};
    font-size: ${({ theme }) => theme.scale(0)};
    margin-left: ${({ theme }) => theme.scale(-6)};
    margin-right: ${({ theme }) => theme.scale(-6)};
  }
`;

const Input = styled.input`
    cursor: 'pointer';
    padding: 0;
    margin: 0 0.2rem 0 0;
    appearance: none;
`;

class Radio extends React.PureComponent {
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
      <FormattedMessage
        id={this.props.label}
        defaultMessage={this.props.label}
      >
        {(txt) => (
          <Label checked={this.props.checked}>
            <Input
              type="radio"
              onChange={this.onChange}
              onClick={this.onClick}
              checked={this.props.checked}
            />
            {txt}
          </Label>
        )}
      </FormattedMessage>
    );
  }
}

export default Radio;
