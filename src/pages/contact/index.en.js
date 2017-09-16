import React from 'react';
import Contact from '../../components/Contact';
import graphql from 'graphql';

const i18n = {
  title: 'Contact'
};

export default (props) => <Contact i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query ContactEn {
    site{
      siteMetadata{
        contact {
          type
          value
          country
          link
        }
      }
    }
  }
`;
