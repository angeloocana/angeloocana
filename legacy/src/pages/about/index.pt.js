import React from 'react';
import AboutMe from '../../components/AboutPage';
import graphql from 'graphql';

const i18n = {
  description: (
    <p>
      Oi! Eu sou o Ângelo! Desenvolvedor Full-Stack desde 2007. <br />
      Amo Linux e tecnologias Open Source tanto quanto amo minha filha e esposa. <br />
      Atualmente uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.
    </p>
  ),
  descriptionForGoogle: `
    Oi! Eu sou o Ângelo! Desenvolvedor Full-Stack desde 2007.
    Amo Linux e tecnologias Open Source tanto quanto amo minha filha e esposa.
    Atualmente uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query AboutPt {
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

