import React from 'react';
import AboutMe from '../../components/AboutPage';
import graphql from 'graphql';

const i18n = {
  description: (
    <p>
      Hi! I am Ângelo, a Freelance Full-Stack Developer since 2007.
      My professional journey started when I was 14 years-old. 
      Since then, I have been passionate about programming.  <br /><br />
      
      Most recently, I have my mindset on TDD, Functional Programming, Offline First, Mobile First
      and Frog Cloud. <br /><br />

      I’m an Arch Linux user and Nodejs Developer.
    </p>
  ),
  descriptionForGoogle: `
    My professional journey started when I was 14 years-old. Since then, I have been passionate about programming. Most recently, I have my mindset on TDD, Functional Programming, Offline First, Mobile First 
    and Frog Cloud.
    
    I’m an Arch Linux user.
  `
};

export default (props) => <AboutMe i18n={i18n} {...props} />;

export const pageQuery = graphql`
  query AboutEn {
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

