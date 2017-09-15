import React from 'react';
import PropTypes from 'proptypes';
import Link from './Link';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const Li = styled.li`
  display: inline;
  padding-right: 1rem;

  a:after{
    content: ' > '
  }
`;

const BreadCrumbItem = ({ link, label }) => {
  return (
    <Li>
      <Link to={link}>
        <FormattedMessage id={label} />
      </Link>
    </Li>
  );
};

BreadCrumbItem.propTypes = {
  link: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

const BreadCrumb = ({ items }) => {
  return (
    <ul>
      {
        items.map(item => (
          <BreadCrumbItem
            {...item}
          />
        ))
      }
    </ul>
  );
};

BreadCrumb.propTypes = {
  items: PropTypes.array.isRequired
};

export default BreadCrumb;
