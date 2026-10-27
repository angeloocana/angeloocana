import React from 'react';
import PropTypes from 'prop-types';

class Html extends React.PureComponent {
  static propTypes = {
    headComponents: PropTypes.array,
    body: PropTypes.string,
    postBodyComponents: PropTypes.array
  }

  render() {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
            var logErro = function (message, source, lineno, colno, error) {

                if(location.href.match('localhost'))
                  return;
            
                alert(message, source, lineno, colno, error);

                var xhr = new XMLHttpRequest();
                var url = "http://staffgeist.com/api/Errors/Erro";
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-type", "application/json");
                var data = JSON.stringify({"url": window.location.href, "message": message, "source": source, "lineno": lineno, "colno": colno, "error": error });
                xhr.send(data);
            };

            window.onerror = function (message, source, lineno, colno, error) {
              logErro(message, source, lineno, colno, error);
            };
            ` }}
          />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          {this.props.headComponents}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
          <meta name="theme-color" content="#ffffff" />
          <link href="/css/reset.css" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css?family=Cambo" rel="stylesheet" />
          <link href="/css/prism-atom-dark.css" rel="stylesheet" />
        </head>
        <body style={{ margin: 0, padding: 0 }}>
          <div
            id="___gatsby"
            dangerouslySetInnerHTML={{ __html: this.props.body }}
            style={{
              height: '100%'
            }}
          />
          {this.props.postBodyComponents}
        </body>
      </html>
    );
  }
}

module.exports = Html;
