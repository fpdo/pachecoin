import Web3 from "web3"
import { web3Loaded, web3AccountLoaded, tokenLoaded, exchangeLoaded } from "./actions"
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

