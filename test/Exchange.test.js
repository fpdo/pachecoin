import { before } from 'lodash'
import { ThemeProvider } from 'react-bootstrap'
import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'
const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')
require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Exchange', ([deployer, feeAccount, user1]) => {
  let token
  let exchange
  let feePercent = 1

  beforeEach(async () => {
    // Deploy Token
    token = await Token.new()

    // user1 needs tokens as by default deployer has all the supply
    await token.transfer(user1, tokens(100), { from: deployer })

    // Create Exchange
    exchange = await Exchange.new(feeAccount, feePercent)
  })

  describe('deployment', () => {
    it('tracks the fee account', async () => {
      // Read feeAccount address
      const result = await exchange.feeAccount()

      // Exchange adddress is set
      result.should.equal(feeAccount)
    })
    it('tracks the fee percent', async () => {
      // Read feePercent
      const result = await exchange.feePercent();

      // Exchange feePercent is set
      result.toString().should.equal(feePercent.toString())
    })
  })

  describe('depositing tokens', () => {
    let result
    let amount = tokens(10)

    describe('success', () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, { from: user1 })
      })

      it('tracks the token deposit', async () => {
        // Check exchange token balance
        let balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        // Check tokens on exchange
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal(amount.toString())
      })
      it('tracks a Deposit event', async () => {
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Deposit')
        event._token.toString().should.equal(token.address, '_token is correct')
        event._user.toString().should.equal(user1, '_user is correct')
        event._amount.toString().should.equal(amount.toString(), '_amount is correct')
        event._balance.toString().should.equal(amount.toString(), '_balance is correct')
      })
    })

    describe('failure', () => {
      it('rejects ether depositors', async () => {
        await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails when no tokens are approved', async () => {
        await exchange.depositToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)

      })
    })
  })

  describe('depositing ether', () => {
    let result
    let amount = ether(1)

    describe('success', () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositEther({ from: user1, value: amount })
      })

      it('tracks the Ether deposit', async () => {
        let balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal(amount.toString())
      })

      it('tracks a Deposit event', async () => {
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Deposit')
        event._token.toString().should.equal(ETHER_ADDRESS, 'Ether Address is correct')
        event._user.toString().should.equal(user1, '_user is correct')
        event._amount.toString().should.equal(amount.toString(), '_amount is correct')
        event._balance.toString().should.equal(amount.toString(), '_balance is correct')
      })
    })
  })

  describe('fallback', () => {
    let amount = ether(1)
    it('reverts when Ether is sent', async () => {
      await exchange.sendTransaction({ value: amount, from: user1 }).should.be.rejected
    })
  })

  describe('withdraw ether', () => {
    let result
    let amount = ether(1)
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount })
    })

    describe('success', () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 })
      })

      it('withdraws Ether funds', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal('0')
      })
      it('tracks a Withdraw event', async () => {
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Withdraw')
        event._token.toString().should.equal(ETHER_ADDRESS, 'Ether Address is correct')
        event._user.toString().should.equal(user1, '_user is correct')
        event._amount.toString().should.equal(amount.toString(), '_amount is correct')
        event._balance.toString().should.equal('0', '_balance is correct')
      })
    })
    describe('failure', () => {
      it('rejects insuficcient balance', async () => {
        await exchange.withdrawEther(ether(2), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('withdraw tokens', () => {
    let result
    let amount = tokens(10)

    describe('success', () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 })
        await exchange.depositToken(token.address, amount, { from: user1 })
      })

      it('tracks the token withdraw', async () => {
        result = await exchange.withdrawToken(token.address, amount, { from: user1 })
        const balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal('0')
      })
      it('tracks a Withdraw event', async () => {
        result = await exchange.withdrawToken(token.address, amount, { from: user1 })
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Withdraw')
        event._token.toString().should.equal(token.address, '_token is correct')
        event._user.toString().should.equal(user1, '_user is correct')
        event._amount.toString().should.equal(amount.toString(), '_amount is correct')
        event._balance.toString().should.equal('0', '_balance is correct')
      })
    })

    describe('failure', () => {
      it('rejects ether withdraws', async () => {
        await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects insufficient balance', async () => {
        await exchange.withdrawToken(token.address, ether(200), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })

  describe('checking balances', () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) })
    })
    it('returns user balance', async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
      result.toString().should.equal(ether(1).toString())
    })
  })
})