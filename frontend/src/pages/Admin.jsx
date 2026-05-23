import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../api'

const ADMIN_USER_KEY = 'pincer.admin.user'
const ADMIN_PASS_KEY = 'pincer.admin.pass'

function formatDate(value){
  if(!value) return '-'
  const date = new Date(value)
  if(Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatPrice(value){
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'JMF',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Admin(){
  const navigate = useNavigate()
  const [user, setUser] = useState(() => localStorage.getItem(ADMIN_USER_KEY) || '')
  const [pass, setPass] = useState(() => localStorage.getItem(ADMIN_PASS_KEY) || '')
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    localStorage.setItem(ADMIN_USER_KEY, user)
    localStorage.setItem(ADMIN_PASS_KEY, pass)
  }, [user, pass])

  const orderCount = orders?.length || 0
  const uniqueRooms = orders ? new Set(orders.map(order => order.room_number)).size : 0

  async function load(){
    setErr(null)
    try{
      const res = await fetchOrders(user, pass)
      if(!res.ok){
        setErr('auth failed')
        return
      }
      const j = await res.json()
      setOrders(j)
    } catch(e){
      setErr('network error')
    }
  }

  function openOrder(uuid){
    navigate(`/order/${uuid}`)
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="admin-kicker">Admin console</div>
          <h1>Orders overview</h1>
          <p>Internal order dashboard for reviewing customer orders and access-controlled actions.</p>
        </div>
        <div className="admin-badge">Protected</div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Orders loaded</div>
          <div className="admin-stat-value">{orderCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Unique rooms</div>
          <div className="admin-stat-value">{uniqueRooms}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Access</div>
          <div className="admin-stat-value">Basic Auth</div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Load orders</h2>
            <p>Enter the admin credentials to fetch the order list.</p>
          </div>
          <button className="admin-load-btn" onClick={load}>Load orders</button>
        </div>

        <div className="admin-login">
          <input placeholder="user" value={user} onChange={e=>setUser(e.target.value)} />
          <input placeholder="pass" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>

        {err && <div className="admin-alert admin-alert-error">{err}</div>}

        {orders && (
          <div className="admin-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>order date</th>
                  <th>item name</th>
                  <th>bonus</th>
                  <th>quantity</th>
                  <th>total price</th>
                  <th>ordered by</th>
                  <th>email</th>
                  <th>room</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o=> (
                  <tr
                    key={o.id}
                    className="orders-table-row-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => openOrder(o.uuid)}
                    onKeyDown={event => {
                      if(event.key === 'Enter' || event.key === ' '){
                        event.preventDefault()
                        openOrder(o.uuid)
                      }
                    }}
                    title="Open order"
                  >
                    <td>{formatDate(o.time)}</td>
                    <td>{o.product?.name || o.item?.name || o.item_id}</td>
                    <td>{o.bonus ? 'yes' : 'no'}</td>
                    <td>{o.quantity}</td>
                    <td>{formatPrice(((o.product?.price || o.item?.price || 0) + (o.bonus ? (o.product?.bonus_price || o.item?.bonus_price || 0) : 0)) * o.quantity)}</td>
                    <td>{o.name}</td>
                    <td>{o.email}</td>
                    <td>{o.room_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {orders && (
        <section className="admin-print-only" aria-hidden="true">
          <h2>Orders</h2>
          <table className="orders-table admin-print-table">
            <thead>
              <tr>
                <th>order date</th>
                <th>item name</th>
                <th>bonus</th>
                <th>quantity</th>
                <th>total price</th>
                <th>ordered by</th>
                <th>date of order</th>
                <th>room</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{formatDate(o.time)}</td>
                  <td>{o.product?.name || o.item?.name || o.item_id}</td>
                  <td>{o.bonus ? 'yes' : 'no'}</td>
                  <td>{o.quantity}</td>
                  <td>{formatPrice(((o.product?.price || o.item?.price || 0) + (o.bonus ? (o.product?.bonus_price || o.item?.bonus_price || 0) : 0)) * o.quantity)}</td>
                  <td>{o.name}</td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{o.room_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
