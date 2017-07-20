import React from 'react';
import PropTypes from 'proptypes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { siteMetadata } from '../../gatsby-config';
import '../css/reset.css';
import '../css/prism-coy.css';

class Wrapper extends React.Component {
  static propTypes = {
    children: PropTypes.func
  }

  render() {
    return (
      <div>
        <Header siteMetadata={siteMetadata} />
        <main>
          {this.props.children()}
        </main>
        <Footer author={siteMetadata.author} />
      </div>
    );
  }
}

export default Wrapper;
