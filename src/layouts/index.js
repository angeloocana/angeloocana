import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import 'typeface-alegreya';
import 'typeface-alegreya-sans';

import '../css/prism-coy.css';
import typography from '../utils/typography';
const rhythm = typography.rhythm;

class Wrapper extends React.Component {
  static propTypes = {
    children: PropTypes.func
  }

  render() {
    return (
      <div
        style={{
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
          maxWidth: rhythm(22),
          margin: '0 auto',
        }}
      >
        <Header />
        {this.props.children()}
      </div>
    );
  }
}

export default Wrapper;
