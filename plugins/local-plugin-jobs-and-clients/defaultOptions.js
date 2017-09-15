module.exports = {
  component: 'src/templates/jobsAndClients.js',
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
