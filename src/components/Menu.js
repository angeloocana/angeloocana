import React from 'react';
import PropTypes from 'prop-types';
import MenuIcon from 'react-icons/lib/fa/bars';
import { InvisibleSpan } from './Invisible';
import styled from 'styled-components';
import Link from 'gatsby-link';
import { endsWith } from 'ramda';
import { injectIntl, FormattedMessage } from 'react-intl';

const CloseNav = styled.section`
  ${props => props.isOpen
    ? ` top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: fixed;`
    : ''};
`;

const Nav = styled.nav`
  text-align: center;
  position: fixed;
  top: 0;
  right: calc(2rem - 100%);  
  width: 100%;
  z-index: 2;
  padding: ${props => props.theme.menu.padding};
  transition-timing-function: ease-in, step-start, cubic-bezier(0.1, 0.7, 1.0, 0.1);
  
  ${props => props.isOpen
    ? `height: 100%;`
    : `height: 4rem;`}; 

  transition: ${props => props.isOpen
    ? 'transform 1s, background-color 0.5s'
    : 'transform 0.5s, background-color 1s'};

  background-color: ${props => props.isOpen
    ? props.theme.menu.opened.bg
    : props.theme.menu.closed.bg};

  ${props => props.isOpen
    ? 'transform: translateX(-60%);'
    : ''};

  @media (min-width: ${props => props.theme.maxWidth}) {
    right: calc(-50% + -29rem);
  }
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

const MenuLink = styled(Link)`
    font-size: ${props => props.theme.menu.a.fontSize};
    padding-bottom: ${props => props.theme.menu.a.paddingBottom};
    display: block;
    text-align: ${props => props.theme.menu.a.textAlign};
    text-decoration: none;
    transition: 0.5s;

    color: ${props => props.selected
    ? props.theme.menu.a.active.color
    : props.theme.menu.a.color};

    &:hover {
      color: ${props => props.theme.menu.a.active.color};
      transition: 0.5s;
    }
`;

const MenuA = MenuLink.withComponent(styled.a``);

const Ul = styled.ul`
    display: block;
    margin-top: ${props => props.theme.menu.ul.marginTop};
    margin-left: ${props => props.theme.menu.ul.marginLeft};
    list-style: none;

    transition: opacity 1s, transform 0.5s;
    transform: ${props => props.isOpen ? 'translateX(-4rem)' : ''};
    opacity: ${props => props.isOpen ? 1 : 0};
`;

class Menu extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };
  }

  open = (event) => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  getMenuItems = (isSelected, menu, langKey) => {
    return menu.map(item => {
      const slug = `/${langKey}${item.slug}`;

      const subItems = item.items
        ? (
          <ul style={{display: 'none'}}>
            {this.getMenuItems(isSelected, item.items, langKey)}
          </ul>)
        : null;

      return (
        <li>
          <FormattedMessage id={item.label}>
            {(label) =>
              item.link
                ? (
                  <MenuA target="_blank" href={item.link}>
                    {label}
                  </MenuA>
                )
                : (
                  <MenuLink selected={isSelected(slug)} to={slug} onClick={this.open}>
                    {label}
                  </MenuLink>
                )
            }
          </FormattedMessage>
          {subItems}
        </li>
      );
    });
  }

  render() {
    const { isOpen } = this.state;
    const isSelected = endsWith(this.props.url);
    const menuItems = this.getMenuItems(isSelected, this.props.menu, this.props.intl.locale);

    return (
      <section>
        <CloseNav isOpen={isOpen} onClick={this.open} />
        <Nav isOpen={isOpen}>
          <MenuLabel htmlFor="cb-menu">
            <MenuIcon />
            <InvisibleSpan>Menu</InvisibleSpan>
            <Checkbox type="checkbox" name="cb-menu" id="cb-menu"
              checked={this.state.isOpen}
              onChange={this.open}
            />
          </MenuLabel>
          <Ul isOpen={isOpen}>
            {menuItems}
          </Ul>
        </Nav>
      </section>
    );
  }
};

Menu.propTypes = {
  menu: PropTypes.array.isRequired,
  url: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired
};

export default injectIntl(Menu);
