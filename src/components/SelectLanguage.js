import React from 'react';
import PropTypes from 'proptypes';
import Br from './flags/Br';
import Us from './flags/Us';
import Fr from './flags/Fr';
import { InvisibleSpan } from '../components/Invisible';
import styled from 'styled-components';
import Link from 'gatsby-link';

const Nav = styled.nav`
  
`;

const Ul = styled.ul`
`;

const Li = styled.li`
  display: inline-block;
  padding: ${props => props.theme.i18n.selectLanguage.li.padding};
  margin: ${props => props.theme.i18n.selectLanguage.li.margin};
  font-size: ${props => props.theme.i18n.selectLanguage.li.fontSize};
  cursor: pointer;
  border-radius: ${props => props.theme.i18n.selectLanguage.li.borderRadius};
  transition: 0.5s;
  background-color: ${props => props.selected
    ? props.theme.i18n.selectLanguage.li.selected.backgroundColor
    : `transparent`};

  &:hover{
    background-color: ${props => props.theme.i18n.selectLanguage.li.selected.backgroundColor};
    transition: 0.5s;
  }
`;

const getIcon = langKey => {
  switch (langKey) {
  case 'en': return <Us />;
  case 'fr': return <Fr />;
  case 'pt': return <Br />;
  default: return null;
  }
};

const SelectLanguage = ({ langs }) => {
  const links = langs.map(lang =>
    <Link to={lang.link}>
      <Li selected={lang.selected}>
        {getIcon(lang.langKey)}
      </Li>
    </Link>
  );

  return (
    <Nav>
      <header>
        <InvisibleSpan>Select your language:</InvisibleSpan>
      </header>
      <Ul>
        {links}
      </Ul>
    </Nav>
  );
};

SelectLanguage.propTypes = {
  langs: PropTypes.array
};

export default SelectLanguage;
