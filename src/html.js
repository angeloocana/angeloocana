import React from 'react';
import Helmet from "react-helmet";
import { GoogleFont, TypographyStyle } from 'react-typography';
import typography from './utils/typography';

module.exports = React.createClass({
  displayName: 'HTML',
  propTypes: {
    body: React.PropTypes.string,
  },
  render() {
    const { body } = this.props;
    const head = Helmet.rewind();

    let css;
    if (process.env.NODE_ENV === 'production') {
      css = <style dangerouslySetInnerHTML={{ __html: require('./public/styles.css') }} />;
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
          {head.title.toComponent()}
          {head.meta.toComponent()}
          <TypographyStyle typography={typography} />
          <GoogleFont typography={typography} />
          {css}
          {this.props.headComponents}
        </head>
        <body>
          <div id="___gatsby" dangerouslySetInnerHTML={{ __html: body }} />
          {this.props.postBodyComponents}
        </body>
      </html>
    );
  },
});
