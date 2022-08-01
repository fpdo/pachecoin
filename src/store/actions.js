// WEB3
export function web3Loaded(connection) {
  return {
    type: 'WEB3_LOADED',
    connection
  }
}

export function web3AccountLoaded(account) {
  return {
    type: 'WEB3_ACCOUNT_LOADED',
    account
  }
}

// TOKEN
export function tokenLoaded(token) {
  return {
    type: 'TOKEN_LOADED',
    token
  }
}

// EXCHANGE
export function exchangeLoaded(exchange) {
  return {
    type: 'EXCHANGE_LOADED',
    exchange
  }
}

// CANCELLED ORDERS
export function cancelledOrdersLoaded(cancelledOrders) {
  return {
    type: 'CANCELLED ORDERS LOADED',
    cancelledOrders
  }
}

// FILLED ORDERS
export function filledOrdersLoaded(filledOrders) {
  return {
    type: 'FILLED ORDERS LOADED',
    filledOrders
  }
}

// ALL ORDERS
export function allOrdersLoaded(allOrders) {
  return {
    type: 'ALL ORDERS LOADED',
    allOrders
  }
}