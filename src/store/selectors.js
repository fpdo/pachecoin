import { create, get } from 'lodash'
import { createSelector } from 'reselect'
import { ETHER_ADDRESS, tokens, ether, GREEN, RED } from '../helpers'
import moment from 'moment'

const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)

export const contractsLoadedSelector = createSelector(
  tokenLoaded,
  exchangeLoaded,
  (tl, el) => (tl && el)
)

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, (orders) => {
  // Sort data in desceding order
  orders = orders.sort((a, b) => b.timestamp - a.timestamp)
  console.log(orders)
})

// Filled orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(filledOrders, (orders) => {
  // Sort data in ascending order to price ocomparison
  orders = orders.sort((a, b) => a.timestamp - b.timestamp)

  // Decorate the orders
  orders = decorateFilledOrders(orders)

  // Sort data in descending order
  orders = orders.sort((a, b) => b.timestamp - a.timestamp)
  console.log(orders)
  return orders
})


// All orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
export const allOrdersLoadedSelector = createSelector(allOrdersLoaded, loaded => loaded)

const allOrders = state => get(state, 'exchange.allOrders.data', [])
export const allOrdersSelector = createSelector(allOrders, (orders) => {
  // Sort orders in descinding order
  orders = orders.sort((a, b) => b.timestamp - a.timestamp)
  console.log(orders)
})

const decorateFilledOrders = (orders) => {
  // Track first order
  let previousOrder = orders[0]
  return (
    orders.map((order) => {
      order = decorateAmount(order)
      order = decorateTime(order)
      order = decoratePriceColor(order, previousOrder)

      // Update previous order once it's decorated
      previousOrder = order
      return order
    })
  )
}

// Decorate price
const decorateAmount = (order) => {
  let etherAmount
  let tokenAmount

  if (order.tokenGive == ETHER_ADDRESS) {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.AmountGive
  }

  let tokenPrice = (etherAmount / tokenAmount)
  let precision = 100000
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice: tokenPrice
  })
}

// Decorate time
const decorateTime = (order) => {
  return ({
    ...order,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a D/M/YY')
  })
}

// Decorate color
const decoratePriceColor = (order, previousOrder) => {
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  // In case of the first order
  if (previousOrder.id == orderId) {
    return GREEN
  }
  // Show green if order price higher than previous order, and the other way around
  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN //success
  } else {
    return RED //danger
  }
}

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id == order.id)
    const cancelledFilled = cancelled.some((o) => o.id == order.id)
    return (orderFilled || cancelledFilled)
  })

  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(
  openOrders,
  (orders) => {
    // Decorate orders
    return orders
  }
)