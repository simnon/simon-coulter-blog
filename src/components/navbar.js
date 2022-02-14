import * as React from "react"
import { Link } from "gatsby"

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
        <div className="container flex-around">
          <div
            id="navMenu"
            className={`navbar-menu ${this.state.navBarActiveClass}`}
          >
            <div className="navbar-start has-text-centered">            
             <Link className="navbar-item" to="/">Home</Link>
             <Link className="navbar-item" to="/about">About</Link>
             <Link className="navbar-item" to="/FavouriteArticles">Fav Articles</Link>
            </div>           
          </div>
        </div>
      </nav>
    )
  }
}

export default Navbar
