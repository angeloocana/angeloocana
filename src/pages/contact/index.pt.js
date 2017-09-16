import React from 'react';
import Contact from '../../components/Contact';
import graphql from 'graphql';

const i18n = {
  title: 'Contato'
};

export default (props) => <Contact i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query ContactPt {
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
