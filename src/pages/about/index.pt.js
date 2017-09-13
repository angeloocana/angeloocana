import React from 'react';
import AboutMe from './_index';

const i18n = {
  title: 'Sobre mim',
  description: (
    <p>
      Desenvolvedor full stack desde 2007. <br />
      Amo Linux e technologias Open Source. <br />
      Hoje uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.
    </p>
  ),
  descriptionForGoogle: `
    Desenvolvedor full stack desde 2007.
    Amo Linux e technologias Open Source.
    Hoje uso React, Nodejs e Arch linux para desenvolvimento de Apps Web e Mobile.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;
