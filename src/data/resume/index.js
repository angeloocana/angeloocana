const { technologies } = require('./technologies');
const { languages } = require('./languages');
const { jobsAndClients } = require('./jobsAndClients');
const { educations } = require('./educations');

const getArray = (list) => {
  return Object.keys(list).map(key => {
    const item = list[key];
    return {
      name: key,
      ...item
    };
  });
};

module.exports = {
  technologies: getArray(technologies),
  educations: getArray(educations),
  jobsAndClients: getArray(jobsAndClients),
  languages: getArray(languages)
};
