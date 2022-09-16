import moment from "moment"
import { ether, tokens, ETHER_ADDRESS, RED, GREEN } from "../helpers"

// Private methods
function decoratePriceColor(order, previousOrder) {
  let tokenPriceClass
  // In acse of the first order
  if (previousOrder.id === order.id) {
    tokenPriceClass = GREEN
  }

  // Show green if order price is higher than previous order, else show red
  if (previousOrder.tokenPrice <= order.tokenPrice) {
    tokenPriceClass = GREEN
  } else {
    tokenPriceClass = RED
  }
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass
  })
}

function decorateTransaction(order) {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: orderType === 'buy' ? 'sell' : 'buy'
  })
}


function decorateUserFilledOrder(order, account) {
  const userOrder = order.user === account
  let orderType
  if (userOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
  }

  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  })
}

function decorateUserOpenOrder(order, account) {
  let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

// Public methods: used by selectors to decorate different types of orders
export function decorators_decorateOrder(order) {
  let etherAmount
  let tokenAmount

  if (order.tokenGive === ETHER_ADDRESS) {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.amountGive
  }

  let precision = 100000
  let tokenPrice = (etherAmount / tokenAmount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice: tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a D/M/YY')
  })
}

export function decorators_filledOrders(orders) {
  // Track first order
  let previousOrder = orders[0]
  return (
    orders.map((order) => {
      order = decorators_decorateOrder(order)
      order = decoratePriceColor(order, previousOrder)
      // Update previous order once it's decorated
      previousOrder = order
      return order
    })
  )
}

export function decorators_orderBookOrders(orders) {
  return (
    orders.map((order) => {
      order = decorators_decorateOrder(order)
      order = decorateTransaction(order)
      return order
    })
  )
}

export function decorators_userFilledOrder(orders, account) {
  return (
    orders.map((order) => {
      order = decorators_decorateOrder(order)
      order = decorateUserFilledOrder(order, account)
      return order
    })
  )
}

export function decorators_userOpenOrder(orders, account) {
  return (
    orders.map((order) => {
      order = decorators_decorateOrder(order)
      order = decorateUserOpenOrder(order, account)
      return order
    })
  )
}