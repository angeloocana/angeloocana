import React from 'react';
import graphql from 'graphql';
import { getUserLangKey } from 'ptz-i18n';
import { navigateTo } from "gatsby-link";

class RedirectIndex extends React.PureComponent {
  constructor(args) {
    super(args);
    const { langs, defaultLangKey } = args.data.site.siteMetadata.languages;
    const langKey = getUserLangKey(langs, defaultLangKey);
    const homeUrl = `/${langKey}/`;

    navigateTo(homeUrl);
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

