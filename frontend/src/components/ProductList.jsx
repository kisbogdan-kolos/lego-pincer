import React, {useState, useEffect} from 'react'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'

export default function ProductList(){
  const [selected, setSelected] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="product-list">
      {loading && <div className="loading">Loading products…</div>}
      {error && <div className="error">Failed to load products</div>}
      <div className="cards">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} />
        ))}
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
