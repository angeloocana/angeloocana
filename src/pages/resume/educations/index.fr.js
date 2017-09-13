import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export const i18n = {
  header: {
    title: `Résumé`,
    pages: [
      {
        label: 'Tecnologias',
        link: '/fr/resume/'
      },
      {
        label: 'Clients e Jobs',
        link: '/fr/resume/jobsAndClients'
      },
      {
        label: 'Éducation',
        link: '/fr/resume/educations',
        selected: true
      },
      {
        label: 'Langues',
        link: '/fr/resume/languages'
      }
    ]
  },
  educations: {
    title: `Éducation`
  }
};

export default (props) =>
  <EducationsPage
    {...props}
    i18n={i18n}
  />;

export const pageQuery = graphql`
  query ResumeEducationsFr {
    site {
      siteMetadata {
        resume {
          educations {
            name
            subject {
              fr
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
