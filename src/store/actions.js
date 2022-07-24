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

// TRADE ORDERS
export function tradeOrdersLoaded(tradeOrders) {
  return {
    type: 'TRADE ORDERS LOADED',
    tradeOrders
  }
}

// ORDERS
export function offerOrdersLoaded(offerOrders) {
  return {
    type: 'OFFER ORDERS LOADED',
    offerOrders
  }
}