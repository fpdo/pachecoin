import React, { Component } from "react"
import { connect } from 'react-redux'
import { orderBookLoadedSelector, orderBookSelector } from '../store/selectors'
import Spinner from './Spinner'

const renderOrder = (order) => {
  console.log(order)
  return (
    <tr key={order.id}>
      <td>{order.tokenAmount}</td>
      <td className={`text-${order.orderTypeClass}`}>{order.tokenPrice}</td>
      <td>{order.etherAmount}</td>
    </tr>
  )
}

const showOrderBook = (props) => {
  const { orderBook } = props
  // console.log(orderBook)
  return (
    <tbody>
      {orderBook.sellOrders.map((order) => renderOrder(order, props))}
      <tr>
        <th>PHC</th>
        <th>PHC/ETH</th>
        <th>ETH</th>
      </tr>
      {orderBook.buyOrders.map((order) => renderOrder(order, props))}
    </tbody>
  )


}
class OrderBook extends Component {
  render() {
    // console.log(this.props.orderBookLoaded)
    console.log(this.props.orderBook)
    return (
      <div className="vertical">
        <div className="card bg-dark text-white">
          <div className="card-header">
            Order Book
          </div>
          <div className="card-body order-book">
            <table className="table table-dark table-sm small">
              {this.props.orderBookLoaded ? showOrderBook(this.props) : <Spinner type='table' />}
            </table>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    orderBookLoaded: orderBookLoadedSelector(state),
    orderBook: orderBookSelector(state)
  }
}

export default connect(mapStateToProps)(OrderBook);