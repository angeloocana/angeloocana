import React from 'react';
import PropTypes from 'prop-types';
import Link from './Link';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const Ul = styled.ul`
  margin: -1rem 0 1rem 0;
  display: inline-block;

  li {
    display: inline;
    padding-right: 1rem;

    a {
      padding-top: 1rem;
      display: inline-block;
    }

    a:after{
      content: ' > '
    }
  }
`;

const BreadCrumbItem = ({ link, label }) => {
  return (
    <li>
      <FormattedMessage id={label} defaultMessage={label}>
        {(txt) => (
          <Link to={link}>
            {txt}
          </Link>
        )}
      </FormattedMessage>
    </li>
  );
};

BreadCrumbItem.propTypes = {
  link: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

const BreadCrumb = ({ items }) => {
  return (
    <Ul>
      {
        items.map(item => (
          <BreadCrumbItem
            {...item}
          />
        ))
      }
    </Ul>
  );
};

BreadCrumb.propTypes = {
  items: PropTypes.array.isRequired
};

export default BreadCrumb;
