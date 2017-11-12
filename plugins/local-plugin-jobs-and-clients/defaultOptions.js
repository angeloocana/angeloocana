module.exports = {
  jobComponent: 'src/templates/resume-job.js',
  projectComponent: 'src/templates/resume-project.js',
  createPagesQuery: `
  {
    site {
      siteMetadata {
        languages {
          langs
        }
        resume {
          jobsAndClients {
            key
            name
            slug
            img
            link
            needWhiteBg
            date {
              start
              end
            }
            projects {
              name
              slug
              years
              description
              link
              technologies {
                years                
                name
                level
                img
                link
                needWhiteBg
              }
            }
            technologies {
              name
              level
              years
              img
              link
              needWhiteBg
            }            
          }
        }
      }
    }
  }`
};
