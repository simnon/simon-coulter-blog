import * as React from "react"
import { useStaticQuery, graphql, Link } from "gatsby"

const FavouritePodcasts = ({ location, title, children }) => {
  var data = useStaticQuery(graphql`
  query FavoritedPodcastEpisodes {
    allOpmlPodcastEpisodes(
      filter: {favorited: {eq: true}}
      sort: {fields: publishDate, order: DESC}
      limit: 10
    ) {
      edges {
        node {
          podcastTitle
          episodeData
          name
          favorited
          publishDate
        }
      }
    }
  }
  `)
  
  const episodes = data.allOpmlPodcastEpisodes.edges.flatMap(edge => edge.node)
  return (<div>
    <ol style={{ listStyle: `none` }}>
    {episodes.map(episode => {
          const podTitle = episode.podcastTitle
          const epTitle = episode.name

          return (
            <li key={episode.name}>
              <article
                className="post-list-item"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  <h2>
                    <Link to={episode.episodeData} itemProp="url">
                      <span itemProp="headline">{podTitle}: {epTitle}</span>
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
export default FavouritePodcasts