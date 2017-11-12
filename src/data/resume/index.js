const { technologies } = require('./technologies');
const { languages } = require('./languages');
const { jobsAndClients, games } = require('./jobsAndClients');
const { educations } = require('./educations');
const { getArray } = require('./getArray');
const { filter } = require('ramda');

const menu = [
  {
    label: 'resume.technologies',
    link: '/resume/'
  },
  {
    label: 'resume.jobsAndClients',
    link: '/resume/jobs-and-clients/'
  },
  {
    label: 'resume.educations',
    link: '/resume/education/'
  },
  {
    label: 'resume.languages',
    link: '/resume/languages/'
  },
  {
    label: 'about',
    link: '/about/'
  }
];

module.exports = {
  technologies: getArray(technologies),
  pinnedTechnologies: filter(t => t.pinned, getArray(technologies)),
  educations: getArray(educations),
  games,
  jobsAndClients,
  languages: getArray(languages),
  menu
};
