import React from 'react';
import AboutMe from './_index';

const i18n = {
  title: 'À propos de moi',
  description: (
    <p>
      Je suis un développeur complet depuis 2007. <br />
      J'adore les technologies Linux et Open Source. <br />
      Aujourd'hui, j'utilise React, Nodejs et Arch linux pour le développement d'applications Web et mobiles.
    </p>
  ),
  descriptionForGoogle: `
    Je suis un développeur complet depuis 2007.
    J'adore les technologies Linux et Open Source.
    Aujourd'hui, j'utilise React, Nodejs et Arch linux pour le développement d'applications Web et mobiles.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;
