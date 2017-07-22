import React from 'react';
import MenuIcon from 'react-icons/lib/fa/bars';
import { InvisibleSpan } from './Invisible';
import styled from 'styled-components';

const Nav = styled.nav`
  text-align: center;
  position: fixed;
  top: 0;
  right: calc(2rem - 100%);
  height: 100%;
  width: 100%;
  padding: ${props => props.theme.menu.padding};
  transition-timing-function: ease-in, step-start, cubic-bezier(0.1, 0.7, 1.0, 0.1);

  transition: ${props => props.isOpen
    ? 'transform 1s, background-color 0.5s'
    : 'transform 0.5s, background-color 1s'};

  background-color: ${props => props.isOpen
    ? props.theme.menu.opened.bg
    : props.theme.menu.closed.bg};

  transform: ${props => props.isOpen
    ? 'translateX(-60%)'
    : ''};
`;

const MenuLabel = styled.label`
  width: ${props => props.theme.menu.label.width};
  height: ${props => props.theme.menu.label.height};
  position: relative;
  float: left;
  cursor: pointer;
  font-size: ${props => props.theme.menu.label.fontSize};

  transition: transform 0.6s, rotate 0.4s;
  transition-timing-function: ease-in, step-start, cubic-bezier(0.1, 0.7, 1.0, 0.1);

  &:hover {
    transform: scale(1.1) rotate(180deg);
    transition: transform 0.6s, rotate 0.4s;
    transition-timing-function: ease-in, step-start, cubic-bezier(0.1, 0.7, 1.0, 0.1);
  }
`;

const Checkbox = styled.input`
  position: absolute;
  opacity: 0.02;
  cursor: pointer;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
`;

const A = styled.a`
    font-size: ${props => props.theme.menu.a.fontSize};
    padding-bottom: ${props => props.theme.menu.a.paddingBottom};
    display: block;
    text-align: ${props => props.theme.menu.a.textAlign};
    text-decoration: none;
    transition: 0.5s;

    color: ${props => props.isActive
    ? props.theme.menu.a.active.color
    : props.theme.menu.a.color};

    &:hover {
      color: ${props => props.theme.menu.a.active.color};
      transition: 0.5s;
    }
`;

const Ul = styled.ul`
    display: block;
    margin-top: ${props => props.theme.menu.ul.marginTop};
    margin-left: ${props => props.theme.menu.ul.marginLeft};

    transition: opacity 1s, transform 0.5s;
    transform: ${props => props.isOpen ? 'translateX(-4rem)' : ''};
    opacity: ${props => props.isOpen ? 1 : 0};
`;

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };
  }

  handleInputChange = (event) => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    const isOpen = this.state.isOpen;
    return (
      <Nav isOpen={isOpen}>
        <MenuLabel htmlFor="cb-menu">
          <MenuIcon />
          <InvisibleSpan>Menu</InvisibleSpan>
          <Checkbox type="checkbox" name="cb-menu" id="cb-menu"
            checked={this.state.isOpen}
            onChange={this.handleInputChange}
          />
        </MenuLabel>
        <Ul isOpen={isOpen}>
          <li><A isActive href="" className="active">Home</A></li>
          <li><A href="">Services</A></li>
          <li><A href="">Tips and Training</A></li>
          <li><A href="">About me</A></li>
          <li><A href="">Contact</A></li>
        </Ul>
      </Nav>
    );
  }
};

export default Menu;
