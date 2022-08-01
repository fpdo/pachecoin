import Web3 from "web3"
import { web3Loaded, web3AccountLoaded, tokenLoaded, exchangeLoaded, cancelledOrdersLoaded, filledOrdersLoaded, allOrdersLoaded } from "./actions"
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'

export const loadWeb3 = async (dispatch) => {
  if (typeof window.ethereum !== 'undefined') {
    const web3 = new Web3(window.ethereum)
    dispatch(web3Loaded(web3))
    return web3
  } else {
    window.alert('Please install MetaMask')
    window.location.assign('https://metamask.io')
  }
}

export const loadAccount = async (dispatch, web3) => {
  const accounts = await web3.eth.getAccounts()
  const account = await accounts[0]
  if (typeof account !== 'undefined') {
    dispatch(web3AccountLoaded(account))
    return account
  } else {
    window.alert('Please login with MetaMask')
    return null
  }
}

export const loadToken = async (dispatch, networkId, web3) => {
  if (typeof networkId !== 'undefined') {
    const token_contract = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    if (typeof token_contract !== 'undefined') {
      dispatch(tokenLoaded(token_contract))
      return token_contract
    } else {
      console.log('Unable to retrieve token')
      return null
    }
  } else {
    console.log('Unable to retrieve network id')
    return null
  }
}

export const loadExchange = async (dispatch, networkId, web3) => {
  if (typeof networkId !== 'undefined') {
    const exchange_contract = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
    if (typeof exchange_contract !== 'undefined') {
      dispatch(exchangeLoaded(exchange_contract))
      return exchange_contract
    } else {
      console.log('Unable to retrieve exchange')
      return null
    }
  } else {
    console.log('Unable to retrieve network id')
    return null
  }
}

export const loadAllOrders = async (dispatch, exchange) => {
  // Fetch cancelled orders "Cancel" event
  const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
  const cancelledOrders = cancelStream.map((event) => event.returnValues)
  // console.log("CANCEL", cancelledOrders)

  // Add cancelled orders to redux store
  dispatch(cancelledOrdersLoaded(cancelledOrders))

  // Fetch filled orders "Trade" event
  const filledStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
  const filledOrders = filledStream.map((event) => event.returnValues)
  // console.log("TRADE", tradeOrders)
  dispatch(filledOrdersLoaded(filledOrders))

  // Fetch all orders "Order" event
  const allOrderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
  const allOrders = allOrderStream.map((event) => event.returnValues)
  // console.log("ORDER", offerOrders)
  dispatch(allOrdersLoaded(allOrders))
}