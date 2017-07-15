module.exports = {
  siteMetadata: {
    title: `Angelo Ocana Software Development and Training`,
    author: {
      name: `Angelo Ocana`,
      email: `angeloocana@gmail.com`
    },
    GA: "UA-61019439-1",
  },
  plugins: [
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `pages`,
                path: `${__dirname}/src/pages/`,
            },
        },
        'gatsby-transformer-remark',
        `gatsby-plugin-sharp`,
    ]
}
