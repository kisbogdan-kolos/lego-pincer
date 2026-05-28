import React, {useEffect, useState} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteOrder, fetchOrder } from '../api'

export default function OrderEdit(){
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionState, setActionState] = useState(null)

  useEffect(()=>{
    let cancelled = false

    async function loadOrder(){
      setLoading(true)
      setError(null)
      try{
        const res = await fetchOrder(uuid)
        if(!res.ok){
          const data = await res.json().catch(()=>null)
          if(!cancelled){
            setOrder(null)
            setError(data?.error || 'A rendelés nem található')
          }
          return
        }
        const data = await res.json()
        if(!cancelled){
          setOrder(data)
        }
      } catch(e){
        if(!cancelled){
          setError('Hálózati hiba')
        }
      } finally {
        if(!cancelled){
          setLoading(false)
        }
      }
    }

    loadOrder()

    return ()=>{
      cancelled = true
    }
  }, [uuid])

  async function handleDelete(){
    setActionState('deleting')
    setError(null)
    try{
      const res = await deleteOrder(uuid)
      if(!res.ok){
        const data = await res.json().catch(()=>null)
        setActionState(null)
        setError(data?.error || 'A törlés nem sikerült')
        return
      }
      setActionState('deleted')
      setTimeout(()=>navigate('/'), 900)
    } catch(e){
      setActionState(null)
      setError('Hálózati hiba')
    }
  }

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="brand">LEGO-PINCÉR</div>
        <nav className="nav">
          <a href="/">FALATOZÓ</a>
          <a href="/">TERMÉKEK</a>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <h1>Rendelés kezelése</h1>
        </section>

        {loading && <div className="modal-message modal-message-status order-page-inline-message">Rendelés betöltése...</div>}

        {!loading && error && <div className="modal-message modal-message-error order-page-inline-message">{error}</div>}

        {!loading && order && (
          <div className="product-card order-page-card">
            <div className="product-hero"></div>
            <div className="product-title">{order.name}</div>
            <div className="product-body">
              <div className="product-row">
                <div className="label">TERMÉK:</div>
                <div className="value product-value-wrap">{order.product?.name || 'Ismeretlen termék'}</div>
              </div>
              <div className="product-row">
                <div className="label">EMAIL:</div>
                <div className="value product-value-wrap">{order.email}</div>
              </div>
              <div className="product-row">
                <div className="label">SZOBA:</div>
                <div className="value">{order.room_number}</div>
              </div>
              <div className="product-row">
                <div className="label">MENNYISÉG:</div>
                <div className="value">{order.quantity} db</div>
              </div>
              <div className="product-row">
                <div className="label">MEGLEPETÉS:</div>
                <div className="value">{order.bonus ? 'Igen' : 'Nem'}</div>
              </div>
              <div className="product-row">
                <div className="label">LÉTREHOZVA:</div>
                <div className="value">{new Date(order.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="order-page-actions order-page-actions-card">
              <button className="order-btn danger-order-btn" onClick={handleDelete} disabled={actionState === 'deleting'}>
                {actionState === 'deleting' ? 'TÖRLÉS...' : 'RENDELÉS TÖRLÉSE'}
              </button>
              <Link to="/" className="secondary-link">Vissza a termékekhez</Link>
            </div>

            {actionState === 'deleted' && <div className="modal-message modal-message-status order-page-inline-message">Rendelés törölve</div>}
          </div>
        )}
      </main>
    </div>
  )
}