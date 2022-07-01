export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
export const EVM_REVERT = 'VM Exception while processing transaction: revert.'

const web3 = require('web3');
export const wait = (seconds) => {
  const timeout_ms = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, timeout_ms))
}

export const ether = (n) => {
  return new web3.utils.BN(
      web3.utils.toWei(n.toString(), 'ether')
  )
}

export const tokens = (n) => ether(n)