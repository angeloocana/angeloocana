import React from 'react';
import PropTypes from 'proptypes';

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
          <label>
            <input
              type="checkbox"
              onChange={this.onChange}
              checked={this.props.selected}
            />
            {this.props.year}
          </label>
        </li>
      );
    }
}

export default Year;
