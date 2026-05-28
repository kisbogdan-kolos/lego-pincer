import React from 'react'
import { Link } from 'react-router-dom'
import ProductList from './components/ProductList'
import Footer from './components/Footer'

export default function App(){
  return (
    <div className="app-root">
      <header className="site-header">
        <div className="brand">LEGO-PINCÉR</div>
        <nav className="nav">
          <a href="#">FALATOZÓ</a>
          <a href="#">TERMÉKEK</a>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <h1>LEGO Kör</h1>
        </section>

        <ProductList />

      </main>
      <Footer />
    </div>
  )
}
