import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {siteMetadata} from '../../gatsby-config';
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
        <Header siteMetadata={siteMetadata} />
        {this.props.children()}
        <Footer author={siteMetadata.author} />
      </div>
    );
  }
}

export default Wrapper;
