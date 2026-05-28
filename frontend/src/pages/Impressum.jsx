import React from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function Impressum(){
  return (
    <div className="app-root impressum-page">
      <header className="site-header">
        <div className="brand">LEGO-PINCÉR</div>
        <nav className="nav">
          <Link to="/">FALATOZÓ</Link>
          <Link to="/">TERMÉKEK</Link>
        </nav>
      </header>

      <main className="content impressum-content">
        <section className="hero impressum-hero">
          <h1>IMPRESSZUM</h1>
        </section>

        <section className="product-card impressum-card">
          <div className="product-title">WEBHELYADATOK</div>
          <div className="product-body">
            <div className="product-row">
              <div className="label">FEJLESZTETTE:</div>
              <div className="value product-value-wrap">
                <a href="https://pek.sch.bme.hu/profiles/kisbogdan" target="_blank" rel="noreferrer">Kis-Bogdán Kolos</a> és GitHub Copilot xd
              </div>
            </div>
            <div className="product-row">
              <div className="label">GITHUB REPO:</div>
              <div className="value product-value-wrap">
                <a href="https://github.com/kisbogdan-kolos/lego-pincer" target="_blank" rel="noreferrer">github.com/kisbogdan-kolos/lego-pincer</a>
              </div>
            </div>
            <div className="product-row">
              <div className="label">ÜZEMELTETI:</div>
              <div className="value product-value-wrap">BME Cloud @ Füred</div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}