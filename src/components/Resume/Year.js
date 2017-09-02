import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';

const Label = styled.label`
  padding: 1rem ${({ theme }) => theme.scale(-3)} 0 ${({ theme }) => theme.scale(-3)};
  display: block;

  ${(props) =>
    props.checked
      ? `font-weight: bold;`
      : ``
}
`;

class Year extends React.Component {
  static propTypes = {
    year: PropTypes.string.isRequired,
    selectYear: PropTypes.func.isRequired,
    selected: PropTypes.bool.isRequired
  }

  onChange = (e) => {
    this.props.selectYear(this.props.year);
  }

  render() {
    return (
      <li>
        <Label checked={this.props.selected}>
          <input
            type="checkbox"
            onChange={this.onChange}
            checked={this.props.selected}
          />
          {this.props.year}
        </Label>
      </li>
    );
  }
}

export default Year;
