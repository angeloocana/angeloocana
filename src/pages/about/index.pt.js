import React from 'react';
import AboutMe from './_index';

const i18n = {
  title: 'Sobre mim',
  description: (
    <p>
      OI! Eu sou o Ângelo! Sou Desenvolvedor Full-Stack desde 2007. <br />
      Amo Linux, technologias Open Source, minha filha e minha mulher. <br />
      Hoje uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.
    </p>
  ),
  descriptionForGoogle: `
    Oi! Eu sou o Ângelo! Desenvolvedor Full-Stack desde 2007. 
Amo Linux e tecnologias Open Source tanto quanto amo minha filha e esposa. 
Atualmente uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.

  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;
