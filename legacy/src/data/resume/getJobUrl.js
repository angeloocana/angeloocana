const getJobUrl = (langKey, jobSlug, projectSlug) => {
  if (!projectSlug) {
    projectSlug = '';
  }
  
  return (`/${langKey}/resume/jobs-and-clients${jobSlug}${projectSlug}`).replace('//', '/');
};

module.exports = {
  getJobUrl
};
