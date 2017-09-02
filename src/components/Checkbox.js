import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';

const Label = styled.label`
  padding: 1rem ${({ theme }) => theme.scale(-3)} 0 ${({ theme }) => theme.scale(-3)};
  display: inline-block;
  font-size: ${({ theme }) => theme.scale(0)};
  width: ${({ theme }) => theme.scale(8)};

  ${(props) => props.checked
    ? `font-weight: bold;`
    : ``}
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
        <input
          type="checkbox"
          onChange={this.onChange}
          checked={this.props.checked}
        />
        {this.props.label}
      </Label>
    );
  }
}

export default Checkbox;
