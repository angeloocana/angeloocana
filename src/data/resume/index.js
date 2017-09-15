const { technologies } = require('./technologies');
const { languages } = require('./languages');
const { jobsAndClients } = require('./jobsAndClients');
const { educations } = require('./educations');
const {getArray} = require('./getArray');

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
  }
];

module.exports = {
  technologies: getArray(technologies),
  educations: getArray(educations),
  jobsAndClients,
  languages: getArray(languages),
  menu
};
