import React from 'react';
import PropTypes from 'prop-types';
// import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

export const getItemsFromArray = (items) =>
  items.map(i => ({
    label: i,
    value: i
  }));

export const addAll = (items) => 
  [{
    label: 'all',
    value: ''
  }].concat(items);

class Select extends React.PureComponent {

  onChange = (event) => {
    this.props.onChange(event.target.value);
  }

  render() {
    const { label, items, selected } = this.props;
    return (
      <label>
        <FormattedMessage id={label} />
        <select value={selected} onChange={this.onChange}>
          {items.map((item, i) => (
            <option key={i} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    );
  };
}

Select.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  selected: PropTypes.any,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func
};

export default Select;
