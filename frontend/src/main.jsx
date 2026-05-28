import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Admin from './pages/Admin'
import Impressum from './pages/Impressum'
import OrderEdit from './pages/OrderEdit'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>} />
        <Route path="/impressum" element={<Impressum/>} />
        <Route path="/admin" element={<Admin/>} />
        <Route path="/order/:uuid" element={<OrderEdit/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
