import React from 'react';
import PropTypes from 'proptypes';
import logo from './imgs/logo.png';
import theme from './themes/theme.js';

let stylesStr;
if (process.env.NODE_ENV === 'production') {
  try {
    // Remove because pf eslint rule
    // stylesStr = require('!raw-loader!../public/styles.css');
    stylesStr = require('../public/styles.css');
  } catch (e) {
    console.log(e);
  }
}

class Html extends React.Component {
  static propTypes = {
    headComponents: PropTypes.array,
    body: PropTypes.string,
    postBodyComponents: PropTypes.array
  }

  render() {
    let css;
    if (process.env.NODE_ENV === 'production') {
      css = (
        <style
          id="gatsby-inlined-css"
          dangerouslySetInnerHTML={{ __html: stylesStr }}
        />
      );
    }

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          {this.props.headComponents}
          <link rel="icon" type="image/png" sizes="1024x1024" href={logo} />
          <link href="https://fonts.googleapis.com/css?family=Cambo" rel="stylesheet" />
          {css}
        </head>
        <body style={{ margin: 0, padding: 0, backgroundColor: theme.bg, color: theme.bg }}>
          <div
            id="___gatsby"
            dangerouslySetInnerHTML={{ __html: this.props.body }}
          />
          {this.props.postBodyComponents}
        </body>
      </html>
    );
  }
}

module.exports = Html;
