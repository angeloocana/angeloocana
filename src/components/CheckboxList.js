import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Checkbox from './Checkbox';
import { FormattedMessage } from 'react-intl';
import { pipe, not, any, contains } from 'ramda';
import { InvisibleSpan } from './Invisible';

const Ul = styled.ul`
  padding: 0;
  justify-content: start;
  display: flex;
  flex-wrap: wrap;
`;

const Li = styled.ul`
  ${(props) => props.allItemsChecked
    ? `
    overflow: hidden;
    transform: scale(0);
    height: 0;
  `
    : `
    transform: scale(1);
    height: auto;
  `
}
`;

export const isAllItemsChecked = pipe(
  any(i => !i.checked),
  not
);

export const getCbListFromArray = (items, checkedItems) => {
  return items.map(i => ({
    label: i,
    value: i,
    checked: contains(i, checkedItems)
  }));
};

const CheckboxList = ({ i18n, items, check, checkAll }) => {
  const allItemsChecked = isAllItemsChecked(items);

  return (
    <fieldset>
      <legend>
        <FormattedMessage id={i18n.title}>
          {(txt) => (
            <InvisibleSpan>
              {txt}
            </InvisibleSpan>
          )}
        </FormattedMessage>
      </legend>
      <Ul>
        <li>
          <Checkbox
            label={i18n.checkAll}
            check={checkAll}
            checked={allItemsChecked}
          />
        </li>
        {items.map(item => (
          <Li allItemsChecked={allItemsChecked}>
            <Checkbox
              value={item.value}
              label={item.label}
              check={check}
              checked={item.checked}
            />
          </Li>
        ))}
      </Ul>
    </fieldset>
  );
};

export const i18nPropTypes = PropTypes.shape({
  title: PropTypes.string.isRequired,
  checkAll: PropTypes.string.isRequired
});

CheckboxList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired
  })).isRequired,
  check: PropTypes.func.isRequired,
  checkAll: PropTypes.func.isRequired,
  i18n: i18nPropTypes
};

export default CheckboxList;
