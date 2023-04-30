module.exports = {
  siteMetadata: {
    title: `Simon Coulter Blog`,
    author: {
      name: `Simon Coulter`,
      summary: `, an engineering manager in Dublin. I've spent most of my life in Ireland but was born in Papua New Guinea. I like building things in my spare time.`,
    },
    description: `Blogging on Engineering Management & building things`,
    siteUrl: `https://www.simoncoulter.com`,
    social: {
      twitter: `simcoulter`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-plugin-env-variables`,
      options: {
        allowList: ["OVERCAST_EMAIL", "OVERCAST_PASSWORD"],
      },
    },
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-pocket`,
      options: {
        consumerKey: "100834-b87731450096ac94eb49d02",
        accessToken: "359aa164-860a-165e-8a90-547864",
        weeksOfHistory: 1252,
        apiMaxRecordsToReturn: 3000,
        getCurrentWeekOnly: `n`,
        stateFilterString: "all",
        tagFilter: true,
        tagFilterString: "simoncoulter.com", //"_untagged_"
        // favouriteFilter: false,
        // favouriteFilterValue: 1,
        // searchFilter: false,
        // searchFilterString: "These 21 things",
        // domainFilter: false,
        // domainFilterString: "buzzfeed.com"
      }
    },
    // {
    //   resolve: `gatsby-source-overcastfm`,
    //   options: {
    //     output: "./data/opml/overcast.opml",
    //   },
    // },
    {
      resolve: "gatsby-source-opml-overcastfm",
      options: {
        // Url to opml file, relative to project root directory
        file: `./data/opml/overcast.opml`,
        name: `opml`,
        skipImages: true,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/about`,
        name: `about`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/projects`,
        name: `projects`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          "gatsby-remark-youtube",
          "gatsby-remark-responsive-iframe",
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `G-V2JCRMKRVH`,
      },
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.nodes.map(node => {
                return Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + node.fields.slug,
                  guid: site.siteMetadata.siteUrl + node.fields.slug,
                  custom_elements: [{ "content:encoded": node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter:{ fileAbsolutePath: { regex:"/(content\/blog\/)/"}}
                ) {
                  nodes {
                    excerpt
                    html
                    fields {
                      slug
                    }
                    frontmatter {
                      title
                      date
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "Gatsby Starter Blog RSS Feed",
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Gatsby Starter Blog`,
        short_name: `GatsbyJS`,
        start_url: `/`,
        background_color: `#ffffff`,
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        // theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/simon-cartoon-portrait.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-react-helmet`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
