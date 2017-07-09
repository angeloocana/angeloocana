module.exports = {
    siteMetadata: {
        title: 'Angelo Ocana',
        author: {
            name: "Angelo Ocana",
            email: "angeloocana@gmail.com"
        },
        linkPrefix: "/angeloocana",
        GA: "UA-61019439-1",
        meta: [
            { "name": "description", "content": "A blog about programming for the web, and various interesting things." },
            { "name": "keywords", "content": "blog, articles, programming, drawing, frontend, backend" },
        ]
    },
    plugins: [
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `pages`,
                path: `${__dirname}/src/pages/`,
            },
        },
        {
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [
                    {
                        resolve: `gatsby-remark-images`,
                        options: {
                            maxWidth: 690,
                        },
                    },
                    {
                        resolve: `gatsby-remark-responsive-iframe`,
                    },
                    `gatsby-remark-prismjs`,
                    `gatsby-remark-copy-linked-files`,
                    `gatsby-remark-smartypants`,
                ],
            },
        },
        `gatsby-plugin-sharp`,
    ]
};
