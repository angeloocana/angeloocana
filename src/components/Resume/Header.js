import React from 'react';
import PropTypes from 'proptypes';
import Link from '../Link';
import H1 from '../H1';
import styled from 'styled-components';

const Li = styled.li`
  a {
    display: inline-block;
    border-radius: 0.2rem;
    padding-top: ${({theme}) => theme.scale(-1)};
    padding-bottom: ${({theme}) => theme.scale(0)};
    padding-left: ${({theme}) => theme.scale(-1)};
    padding-right: ${({theme}) => theme.scale(0)};

    margin-top: 0;
    margin-bottom: ${({theme}) => theme.scale(0)};
    margin-left: 0;
    margin-right: ${({theme}) => theme.scale(0)};

    ${({theme, selected}) => selected
    ? `
      color: ${theme.colors.black};
      font-size: ${theme.scale(2)};
      background-color: ${theme.colors.white};
    `
    : `
      color: ${theme.colors.white};
      font-size: ${theme.scale(1)};
      background-color: ${theme.colors.black};
    `
}
}

  a:hover {
    color: ${({theme}) => theme.colors.black};
    font-size: ${({theme}) => theme.scale(2)};
    background-color: ${({theme}) => theme.colors.white};
  }
`;

const Ul = styled.ul`
  padding-top: ${({theme}) => theme.scale(2)};
  padding-bottom: ${({theme}) => theme.scale(0)};
  padding-left: 0;
  padding-right: 0;

  display: flex;
  flex-wrap: wrap;
  flex-direction: column;

  @media (min-width: 45rem) {
    flex-direction: row;
  }
`;

const Page = ({ label, link, selected }) => {
  return (
    <Li selected={selected}>
      <Link to={link}>
        {label}
      </Link>
    </Li>
  );
};

Page.propTypes = {
  label: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  selected: PropTypes.bool
};

const Header = (props) => {
  return (
    <header>
      <H1>{props.i18n.title}</H1>
      <Ul>
        {props.i18n.pages.map(page => (<Page {...page} />))}
      </Ul>
    </header>
  );
};

Header.propTypes = {
  i18n: PropTypes.shape({
    pages: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
