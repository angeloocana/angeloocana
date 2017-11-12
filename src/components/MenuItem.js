import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Link from 'gatsby-link';
import { FormattedMessage } from 'react-intl';

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

class MenuItem extends React.PureComponent {
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

  render = () => {
    const { item } = this.props;

    const subItems = item.items
      ? (
        <ul style={{ display: 'none' }} isOpen={this.state.isOpen}>
          {item.items.map(subItem => (
            <MenuItem item={subItem} />
          ))}
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
                <MenuLink selected={item.selected} to={item.slug} onClick={this.open}>
                  {label}
                </MenuLink>
              )
          }
        </FormattedMessage>
        {subItems}
      </li>
    );
  }
};

MenuItem.propTypes = {
  item: PropTypes.shape({
    slug: PropTypes.string,
    link: PropTypes.string,
    selected: PropTypes.bool
  }).isRequired
};

export default MenuItem;
