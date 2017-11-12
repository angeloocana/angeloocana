import React from 'react';
import graphql from 'graphql';
import Layout from './_layout';
import { addLocaleData } from 'react-intl';

import messages from '../data/messages/fr';
import fr from 'react-intl/locale-data/fr';
import 'intl/locale-data/jsonp/fr';

addLocaleData(fr);


export default (props) => (
  <Layout
    {...props}
    i18nMessages={messages}
  />);

export const pageQuery = graphql`
  query LayoutFr {
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
