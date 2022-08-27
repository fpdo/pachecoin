import { get, groupBy, reject, maxBy, minBy, last } from 'lodash'
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
  return orders
})


// All orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
export const allOrdersLoadedSelector = createSelector(allOrdersLoaded, loaded => loaded)

const allOrders = state => get(state, 'exchange.allOrders.data', [])
export const allOrdersSelector = createSelector(allOrders, (orders) => {
  // Sort orders in descinding order
  orders = orders.sort((a, b) => b.timestamp - a.timestamp)
})

const decorateFilledOrders = (orders) => {
  // Track first order
  let previousOrder = orders[0]
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decoratePriceColor(order, previousOrder)

      // Update previous order once it's decorated
      previousOrder = order
      return order
    })
  )
}

const decorateOrder = (order) => {
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

// Decorate color
const decoratePriceColor = (order, previousOrder) => {
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  // In case of the first order
  if (previousOrder.id === orderId) {
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
    const orderFilled = filled.some((o) => o.id === order.id)
    const orderCancelled = cancelled.some((o) => o.id === order.id)
    return (orderFilled || orderCancelled)
  })

  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

// Create the order book
export const orderBookSelector = createSelector(
  openOrders,
  (orders) => {
    // Decorate orders
    orders = decorateOrderBookOrders(orders)
    // Group orders by "orderType"
    orders = groupBy(orders, 'orderType')
    // Fetch buy orders
    const buyOrders = get(orders, 'buy', [])
    // Sort buy orders by token price
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }
    // Fetch sell orders
    const sellOrders = get(orders, 'sell', [])
    // Sort sell orders by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }
    return orders
  }
)

const decorateOrderBookOrders = (orders) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateOrderBookOrder(order)
      return (order)
    })
  )
}

const decorateOrderBookOrder = (order) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orerFillClass: orderType === 'buy' ? 'sell' : 'buy'
  })
}

export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    //Find our orders
    orders = orders.filter((o) => o.user === account || o.userFill === account)
    // Sort date ascending
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    // Decorate orders
    orders = decorateMyFilledOrder(orders, account)
    return orders
  }
)

const decorateMyFilledOrder = (orders, account) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateFilledOrder(order, account)
      return (order)
    })
  )
}

const decorateFilledOrder = (order, account) => {
  const myOrder = order.user === account
  let orderType
  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
  }

  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : "-")
  })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)
export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    //Filter order created by current account
    orders = orders.filter((o) => o.user === account)
    //Decorate order - add display attributes
    orders = decorateMyOpenOrders(orders)
    //Sort orders by date descending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)
    return orders
  }
)

const decorateMyOpenOrders = (orders, account) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyOpenOrder(order, account)
      return (order)
    })
  )
}

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
export const priceChartSelector = createSelector(
  filledOrders,
  (orders) => {
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    orders = orders.map((o) => decorateOrder(o))
    // Get last two order for fianl price & price change
    let secondLastOrder, lastOrder
    [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
    // Get last order price
    const lastPrice = get(lastOrder, 'tokenPrice', 0)
    const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)
    return ({
      lastPrice,
      lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
      series: [{
        data: buildGraphData(orders)
      }]
    })
  }
)

const buildGraphData = (orders) => {
  // Group the orders by hour for the graph
  orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
  // Get each hour where data exists
  const hours = Object.keys(orders)
  // Build the graph series
  const graphData = hours.map((hour) => {
    // Fetch all the orders from current hour
    const group = orders[hour]
    // Calculate price values - open, high, low, close
    const open = group[0] // first order
    const high = maxBy(group, 'tokenPrice') // high price
    const low = minBy(group, 'tokenPrice') // low price
    const close = group[group.length - 1]  // last order
    return ({
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
    })
  })
  return graphData
}