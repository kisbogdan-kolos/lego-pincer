import React from 'react'

export default function ProductCard({product,onOpen}){
  const availableFrom = product.available_from ? new Date(product.available_from).toLocaleString() : 'nincs adat'
  const availableUntil = product.available_until ? new Date(product.available_until).toLocaleString() : 'nincs adat'

  return (
    <div className="product-card">
      <div className="product-hero"></div>
      <div className="product-title">{(product.name||'').toUpperCase()}</div>
      <div className="product-body">
        <div className="product-row">
          <div className="label">LEÍRÁS:</div>
          <div className="value product-value-wrap">{product.description}</div>
        </div>
        <div className="product-row">
          <div className="label">ÁR:</div>
          <div className="value">{product.price} JMF</div>
        </div>
        <div className="product-row">
          <div className="label">ELÉRHETŐ MENNYISÉG:</div>
          <div className="value">{product.available_quantity} db</div>
        </div>
        <div className="product-row">
          <div className="label">RENDELHETŐ:</div>
          <div className="value product-value-wrap">{availableFrom} - {availableUntil}</div>
        </div>
      </div>
      <button className="order-btn" onClick={onOpen}>RENDELÉS</button>
    </div>
  )
}
