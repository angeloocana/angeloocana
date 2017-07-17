import React from 'react';
import MenuIcon from 'react-icons/lib/fa/bars';

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };
  }

  handleInputChange = (event) => {
    console.log('state', this.state);
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <nav className={this.state.isOpen ? 'menu-opened' : 'menu-closed'}>
        <label className="menu-icon" htmlFor="cb-menu">
          <MenuIcon />
          <span className="element-invisible">Menu</span>
          <input type="checkbox" name="cb-menu" id="cb-menu"
            checked={this.state.isOpen}
            onChange={this.handleInputChange}
          />
        </label>
        <ul>
          <li><a href="" className="active">Home</a></li>
          <li><a href="">Services</a></li>
          <li><a href="">Tips and Training</a></li>
          <li><a href="">About me</a></li>
          <li><a href="">Contact</a></li>
        </ul>
      </nav>
    );
  }
};

export default Menu;
