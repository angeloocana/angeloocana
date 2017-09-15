module.exports = {
  createPagesQuery: `
  {
    site {
      siteMetadata {
        langs
        resume {
          jobsAndClients{
            slug
          }
        }
      }
    }
  }`
};
