import * as React from "react"
import { Link } from "gatsby"
import {Divider,Flex,Spacer} from "@chakra-ui/react"

const Navbar = class extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      navBarActiveClass: '',
    }
  }

  render() {
    return (
      <nav
        className="navbar is-transparent"
        role="navigation"
        aria-label="main-navigation"
      >
        <div className="container flex-end">
        <Divider orientation="horizontal" />
          <div
            id="navMenu"
            className={`navbar-menu ${this.state.navBarActiveClass}`}
          >
            <Flex className="navbar-container container">
              <div className="navbar-header container title-header">
                <Link to="/">Simon Coulter Blog</Link>
              </div>
              <Spacer />
              <div className="horz-container container">            
                <Link className="navbar-item" to="/">Home</Link>
                <Link className="navbar-item" to="/FavouriteArticles">Favourite Articles</Link>
                <Link className="navbar-item" to="/projects">Projects</Link>
                <Link className="navbar-item" to="/about">About</Link>
              </div>           
            </Flex>
          </div>
        </div>
        <Divider orientation="horizontal" />
      </nav>
    )
  }
}

export default Navbar
