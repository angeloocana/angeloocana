import React from 'react';
import AboutMe from './_index';

const i18n = {
  title: 'About me',
  description: (
    <p>
      I am full stack developer since 2007. <br />
      I love Linux and Open Source technologies. <br />
      Today I'm using React, Nodejs and Arch linux for development of Web and Mobile Apps.
    </p>
  ),
  descriptionForGoogle: `
      I am full stack developer since 2007.
      I love Linux and Open Source technologies.
      Today I'm using React, Nodejs and Arch linux for development of Web and Mobile Apps.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;
