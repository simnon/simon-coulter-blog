import * as React from "react"
import Navbar from "./navbar"
import Bio from "./bio"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath

  return (
    <div>
    <Navbar />
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      
      
      <main>{children}</main>
      <footer>
      <Bio />
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.com">Gatsby</a>
      </footer>
    </div>
    </div>
  )
}

export default Layout
