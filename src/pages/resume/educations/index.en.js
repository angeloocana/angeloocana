import React from 'react';
import EducationsPage from '../../../components/Resume/EducationsPage';
import graphql from 'graphql';

export const i18n = {
  header: {
    title: `Curriculum Vitae`,
    pages: [
      {
        label: 'Technologies',
        link: '/en/resume/'
      },
      {
        label: 'Jobs and Clients',
        link: '/en/resume/jobsAndClients'
      },
      {
        label: 'Educations',
        link: '/en/resume/educations',
        selected: true
      },
      {
        label: 'Languages',
        link: '/en/resume/languages'
      }
    ]
  },
  educations: {
    title: `Educations`
  }
};

export default (props) =>
  <EducationsPage
    {...props}
    i18n={i18n}
  />;

export const pageQuery = graphql`
  query ResumeEducationEn {
    site {
      siteMetadata {
        resume {
          educations {
            name
            subject {
              en
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
