// WEB3
export function web3Loaded(connection) {
  return {
    type: 'WEB3_LOADED',
    connection
  }
}

export function accountLoaded(account) {
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

