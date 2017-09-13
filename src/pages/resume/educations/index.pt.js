import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export const i18n = {
  header: {
    title: `Currículo`,
    pages: [
      {
        label: 'Tecnologias',
        link: '/pt/resume/'
      },
      {
        label: 'Clients e Jobs',
        link: '/pt/resume/jobsAndClients'
      },
      {
        label: 'Educação',
        link: '/pt/resume/educations',
        selected: true
      },
      {
        label: 'Idiomas',
        link: '/pt/resume/languages'
      }
    ]
  },
  educations: {
    title: `Educação`
  }
};

export default (props) =>
  <EducationsPage
    {...props}
    i18n={i18n}
  />;

export const pageQuery = graphql`
  query ResumeEducationsPt {
    site {
      siteMetadata {
        resume {
          educations {
            name
            subject {
              pt
            }
            needWhiteBg
            link
            fullName
            years
            img
          }
        }
      }
    }
  }
`;
