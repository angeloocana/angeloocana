import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Radio from './Radio';
import { FormattedMessage } from 'react-intl';
import { contains } from 'ramda';
import { InvisibleSpan } from './Invisible';

const Ul = styled.ul`
    display: flex;
    flex-flow: row wrap;
    justify-content: start;
    margin: 0 0 1rem 0;
    padding: 0;
`;

export const getCbListFromArray = (items, checkedItems) => {
  return items.map(i => ({
    label: i,
    value: i,
    checked: contains(i, checkedItems)
  }));
};

const RadioList = (props) => {
  return (
    <fieldset>
      <legend>
        <FormattedMessage id={props.i18n.title}>
          {(txt) => (
            <InvisibleSpan>
              {txt}
            </InvisibleSpan>
          )}
        </FormattedMessage>
      </legend>
      <Ul>
        {props.items.map(item => (
          <li>
            <Radio
              value={item.value}
              label={item.label}
              check={props.check}
              checked={item.checked}
            />
          </li>
        ))}
      </Ul>
    </fieldset>
  );
};

export const i18nPropTypes = PropTypes.shape({
  title: PropTypes.string.isRequired
});

RadioList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired
  })).isRequired,
  check: PropTypes.func.isRequired,
  i18n: i18nPropTypes
};

export default RadioList;
