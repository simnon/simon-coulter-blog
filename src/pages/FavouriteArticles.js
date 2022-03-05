import * as React from "react"
import {graphql} from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import FavouritePocket from "../components/pocket"

const FavouriteArticles = ({ data, location }) => {
  const siteTitle = `Favourite Articles`

  return (
    <Layout location={location} title={siteTitle}>
      <Seo title="Favourite Articles" />
      <header>
        <h1>Favourite Articles</h1>
        <p>A collection of articles that have stood out to me in terms of quality and value.</p>
        <FavouritePocket />
      </header>
    </Layout>
  )
}

export default FavouriteArticles

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
        }
      }
    }
  }
`
