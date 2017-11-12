import React from 'react';
import Contact from '../../components/Contact';
import graphql from 'graphql';

export default (props) => <Contact {...props} />;

export const pageQuery = graphql`
  query ContactFr {
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
