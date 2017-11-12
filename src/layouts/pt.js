import React from 'react';
import graphql from 'graphql';
import Layout from './_layout';
import { addLocaleData } from 'react-intl';

import messages from '../data/messages/pt';
import pt from 'react-intl/locale-data/pt';
import 'intl/locale-data/jsonp/pt';

addLocaleData(pt);


export default (props) => (
  <Layout
    {...props}
    i18nMessages={messages}
  />);

export const pageQuery = graphql`
  query LayoutPt {
    site {
      siteMetadata {
        languages {
          defaultLangKey
          langs
        }
        author {
          name
          homeCity
          email
          defaultLink
        }
        sourceCodeLink
        menu {
          label
          link
          slug
          items{
            label
            slug
          }
        }
      }
    }
  }
`;
