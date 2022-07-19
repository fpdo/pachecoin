import Web3 from "web3"
import { web3Loaded, accountLoaded, tokenLoaded, exchangeLoaded } from "./actions"

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
  const account = accounts[0]
  if (typeof account !== 'undefined') {
    dispatch(accountLoaded(account))
    return accounts
  } else {
    window.alert('Please login with MetaMask')
    return null
  }
}

export const loadToken = async (dispath, token, web3) => {
  const networkId = await web3.eth.net.getId()
  if (typeof networkId !== 'undefined') {
    const token_contract = new web3.eth.Contract(token.abi, token.networks[networkId].address)
    if (typeof token_contract !== 'undefined') {
      dispath(tokenLoaded(token_contract))
    } else {
      window.alert('Unable to retrieve token')
      return null
    }
  } else {
    window.alert('Unable to retrieve network id')
    return null
  }
}

export const loadExchange = async (dispath, exchange, web3) => {
  const networkId = await web3.eth.net.getId()
  if (typeof networkId !== 'undefined') {
    const exchange_contract = new web3.eth.Contract(exchange.abi, exchange.networks[networkId].address)
    if (typeof exchange_contract !== 'undefined') {
      dispath(exchangeLoaded(exchange_contract))
    } else {
      window.alert('Unable to retrieve exchange')
      return null
    }
  } else {
    window.alert('Unable to retrieve network id')
    return null
  }
}

