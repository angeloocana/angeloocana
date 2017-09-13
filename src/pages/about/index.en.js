import React from 'react';
import AboutMe from './_index';

const i18n = {
  title: 'About me',
  description: (
    <p>
      Hi! I am Ângelo, a Freelance Full-Stack Developer with a Global mindset since 2007. <br />
      I love Linux and Open Source technologies as much as my wife and daughter. <br />
      Today I'm using React, Nodejs and Arch linux for development of Web and Mobile Apps.
    </p>
  ),
  descriptionForGoogle: `
    Hi! I am Ângelo, a Freelance Full-Stack Developer with a Global mindset since 2007.
    I love Linux and Open Source technologies as much as my wife and daughter.
    Today I'm using React, Nodejs and Arch linux for development of Web and Mobile Apps.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;
