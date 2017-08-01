import React from 'react';
import Br from './flags/Br';
import Us from './flags/Us';
import Fr from './flags/Fr';
import { InvisibleSpan } from '../../components/Invisible';
import styled from 'styled-components';

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

const SelectLanguage = () => {
  return (
    <Nav>
      <header>
        <InvisibleSpan>Select your language:</InvisibleSpan>
      </header>
      <Ul>
        <Li selected>
          <Us />
        </Li>
        <Li>
          <Fr />
        </Li>
        <Li>
          <Br />
        </Li>
      </Ul>
    </Nav>
  );
};

export default SelectLanguage;
