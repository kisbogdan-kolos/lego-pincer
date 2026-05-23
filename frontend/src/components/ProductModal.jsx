import React, {useState, useMemo} from 'react'
import { submitOrder } from '../api'

export default function ProductModal({product,onClose}){
  const [qty,setQty] = useState(1)
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [room,setRoom] = useState('')
  const [bonus,setBonus] = useState(false)
  const [status,setStatus] = useState(null)
  const [errorMessage,setErrorMessage] = useState(null)
  const [flash,setFlash] = useState(false)

  const maxAvailable = product.available_quantity ?? 0

  const basePrice = Number(product.price || 0)
  const bonusPrice = Number(product.bonus_price || 0)
  const totalPrice = useMemo(()=>{
    // live total includes the bonus price for each ordered item
    return (basePrice + (bonus ? bonusPrice : 0)) * qty
  },[basePrice, bonus, bonusPrice, qty])

  React.useEffect(()=>{
    // flash the price briefly when quantity changes
    setFlash(true)
    const t = setTimeout(()=>setFlash(false), 220)
    return ()=>clearTimeout(t)
  },[qty, bonus])

  async function handleSubmit(e){
    e.preventDefault()
    if(qty > maxAvailable){
      setStatus('insufficient quantity')
      return
    }
    setStatus('sending')
    try{
      setErrorMessage(null)
      const res = await submitOrder({
        item_id: product.id,
        name,
        email,
        room_number: room,
        quantity: qty,
        bonus
      })
      if(res.ok){
        setStatus('Sikeres rendelés')
      } else {
        const j = await res.json()
        // if server indicates room validation, surface prominently
        if(j.error && /room/i.test(j.error)){
          setStatus(null)
          setErrorMessage(j.error)
        } else {
          setErrorMessage(null)
          setStatus(j.error || 'error')
        }
      }
    } catch(err){
      setStatus('error')
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 title={product.name}>{(product.name||'').toUpperCase()}</h2>
        <form onSubmit={handleSubmit} className="order-form">
          <label>NÉV
            <input value={name} onChange={e=>setName(e.target.value)} required />
          </label>
          <label>EMAIL
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label>SZOBA
            <input value={room} onChange={e=>setRoom(e.target.value)} required />
          </label>
          <label>MENNYISÉG
            <div className="qty">
              <button type="button" className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>-</button>
              <div className="qty-val">{qty}</div>
              <button type="button" className="qty-btn" onClick={()=>setQty(q=>Math.min(q+1, maxAvailable))}>+</button>
            </div>
            <div className="avail">Elérhető: {maxAvailable} db</div>
          </label>
          <label className="checkbox"><input type="checkbox" checked={bonus} onChange={e=>setBonus(e.target.checked)} /> Kérek meglepetést</label>

          <div className="price-row">
            <div className={"price" + (flash? ' flash':'')}>{totalPrice} JMF</div>
            <div className="price-note">{bonus ? 'meglepetéssel 🎉' : 'meglepetés nélkül :('}</div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary" disabled={qty > maxAvailable || maxAvailable===0}>{maxAvailable===0? 'Elfogyott :(':'RENDELÉS'}</button>
          </div>
          <div className="modal-messages" aria-live="polite">
            {status && <div className="modal-message modal-message-status">{status}</div>}
            {errorMessage && <div className="modal-message modal-message-error" role="alert" aria-live="assertive">{errorMessage}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}
