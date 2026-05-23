export async function submitOrder(body){
  return fetch('/api/order', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  })
}

export async function fetchOrders(username, password){
  const headers = new Headers()
  headers.set('Authorization', 'Basic ' + btoa(username + ':' + password))
  return fetch('/api/order', {headers})
}

export async function fetchProducts(){
  return fetch('/api/product')
}

export async function fetchOrder(uuid){
  return fetch(`/api/order/${uuid}`)
}

export async function deleteOrder(uuid){
  return fetch(`/api/order/${uuid}`, {
    method: 'DELETE'
  })
}
