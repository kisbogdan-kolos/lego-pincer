import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>© LEGO Kör 2026</span>
        <div className="site-footer-links">
          <Link to="/impressum">Impresszum</Link>
          <a href="https://github.com/kisbogdan-kolos/lego-pincer/issues" target="_blank" rel="noreferrer">Hibabejelentés</a>
        </div>
      </div>
    </footer>
  )
}