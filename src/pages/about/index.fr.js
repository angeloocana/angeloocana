import React from 'react';
import AboutMe from '../../components/AboutPage';
import graphql from 'graphql';

const i18n = {
  description: (
    <p>
      Bonjour! Je suis Angelo! Depuis 2007, je suis un développeur complet. <br />
      J'aime Linux, Open Source technologies, ma fille et ma femme. <br />
      Aujourd'hui, j'utilise React, Nodejs et Arch Linux pour le développement d'applications Web et mobiles.
    </p>
  ),
  descriptionForGoogle: `
    Bonjour! Je suis Angelo! Depuis 2007, je suis un développeur complet.
    J'aime Linux, Open Source technologies, ma fille et ma femme.
    Aujourd'hui, j'utilise React, Nodejs et Arch Linux pour le développement d'applications Web et mobiles.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query AboutFr {
    site {
      siteMetadata {
        resume {
          menu {
            label
            link
          }        
        }
      }
    }
  }
`;
