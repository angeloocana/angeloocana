import React from 'react';
import graphql from 'graphql';
import { redirectToHome } from 'ptz-i18n';

class RedirectIndex extends React.PureComponent {
  constructor(args) {
    super(args);
    const { langs, defaultLangKey } = args.data.site.siteMetadata.languages;
    redirectToHome(langs, defaultLangKey);
  }

  render() {
    return (<div />);
  }
}

export default RedirectIndex;

export const pageQuery = graphql`
  query IndexQuery {    
    site{
      siteMetadata{
        languages {
          defaultLangKey
          langs
        }
      }
    }
  }
`;
