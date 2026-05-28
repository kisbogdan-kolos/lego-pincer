import React, {useEffect, useRef, useState} from 'react'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'
import successSound from '../img/beep-boop.mp3'

export default function ProductList(){
  const [selected, setSelected] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successCue, setSuccessCue] = useState(null)
  const successTimerRef = useRef(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    fetch('/api/product')
      .then(r=>{
        if(!r.ok) throw new Error('network')
        return r.json()
      })
      .then(json=>{ if(mounted) setProducts(json) })
      .catch(err=>{ if(mounted) setError(err.message) })
      .finally(()=>{ if(mounted) setLoading(false) })

    return ()=>{ mounted = false }
  },[])

  useEffect(()=>{
    return ()=>{
      if(successTimerRef.current){
        clearTimeout(successTimerRef.current)
      }
    }
  },[])

  function handleOrderSuccess(product){
    setSelected(null)
    setSuccessCue({
      id: product.id,
      name: product.name || 'Sikeres rendelés'
    })

    if(successTimerRef.current){
      clearTimeout(successTimerRef.current)
    }

    const audio = new Audio(successSound)
    audio.play().catch(()=>{})

    successTimerRef.current = setTimeout(()=>{
      setSuccessCue(null)
      successTimerRef.current = null
    }, 3500)
  }

  return (
    <div className="product-list">
      {loading && <div className="loading">Termékek betöltése…</div>}
      {error && <div className="error">Nem sikerült betölteni a termékeket</div>}
      <div className="cards">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} />
        ))}
      </div>

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => handleOrderSuccess(selected)}
        />
      )}

      {successCue && (
        <div className="success-overlay" role="status" aria-live="polite" aria-label={successCue.name}>
          <div className="success-badge">
            <svg className="success-check" viewBox="0 0 64 64" aria-hidden="true">
              <circle className="success-check-circle" cx="32" cy="32" r="22" />
              <path className="success-check-mark" d="M22 33.5l7.2 7.2L42.5 27.4" />
            </svg>
            <div className="success-text">
              <div className="success-title">Sikeres rendelés</div>
              <div className="success-subtitle">{successCue.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
