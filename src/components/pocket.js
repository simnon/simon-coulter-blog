import * as React from "react"
import { useStaticQuery, graphql, Link } from "gatsby"

const FavouritePocket = ({ location, title, children }) => {
  var data = useStaticQuery(graphql`
    query PocketFavourites {
      allPocketArticle(sort: {order: DESC, fields: id}) {
        edges {
          node {
            id
            url
            title
            favourite
          }
        }
      }
    }
  `)
  // data = [{'title': 'a'}, {'title': 'b'}, {'title': 'c'}]
  data = data.allPocketArticle.edges
  console.log('testing')
  console.log(JSON.stringify(data, null, 2))
  return (<div>
    <ol style={{ listStyle: `none` }}>
    {data.map(article => {
          const title = article.node.title

          return (
            <li key={article.id}>
              <article
                className="post-list-item"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  <h2>
                    <Link to={article.node.url} itemProp="url">
                      <span itemProp="headline">{title}</span>
                    </Link>
                  </h2>
                </header>
              </article>
            </li>
          )
        })}
    </ol>
  </div>)
}
export default FavouritePocket