import { technologies } from './technologies';
import { languages } from './languages';
import { jobsAndClients } from './jobsAndClients';
import { educations } from './educations';

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
