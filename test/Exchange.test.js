import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'
const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')
require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
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

  describe('making orders', async () => {
    let result

    beforeEach(async () => {
      result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    it('tracks the newly created order', async () => {
      const orderCount = await exchange.orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1', 'id is correct')
      order.user.should.equal(user1, 'user is correct')
      order.tokenGet.should.equal(token.address, 'tokenGet address is correct')
      order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      order.amountGive.toString().should.equal(ether(1).toString(), 'tokenGive is correct')
      order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })

    it('emit an "Order" event', async () => {
      const log = result.logs[0]
      log.event.should.eq('Order')
      const event = log.args
      event.id.toString().should.equal('1', 'id is correct')
      event.user.should.equal(user1, 'user is correct')
      event.tokenGet.should.equal(token.address, 'tokenGet address is correct')
      event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      event.amountGive.toString().should.equal(ether(1).toString(), 'tokenGive is correct')
      event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })
  })

  describe('order actions', async () => {
    beforeEach(async () => {
      // user1 deposits Eth only
      await exchange.depositEther({ from: user1, value: ether(1) })
      // Give tokens to user2
      await token.transfer(user2, tokens(100), {from: deployer})
      // user2 deposits tokens only
      await token.approve(exchange.address, tokens(2), {from: user2})
      await exchange.depositToken(token.address, tokens(2), {from: user2})
      // user1 makes an order to buy tokens with ether
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })

    })
    describe('filling order', async () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          // user2 fills order
          result = await exchange.fillOrder('1', {from: user2})
        })

        it('executes the trade & charges fees', async () => {
          let balance
          balance = await exchange.balanceOf(token.address, user1)
          balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
          balance.toString().should.equal(ether(1).toString(), 'user2 received ether')
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
          balance.toString().should.equal('0', 'user1 has ether deducted')
          balance = await exchange.balanceOf(token.address, user2)
          balance.toString().should.equal(tokens(0.99).toString(), 'user2 has fewer tokens')
          const feeAccount = await exchange.feeAccount()
          balance = await exchange.balanceOf(token.address, feeAccount)
          balance.toString().should.equal(tokens(0.01).toString(), 'feeAcount received fee')
        })

        it('updates filled orders', async () => {
          const orderFilled = await exchange.orderFilled(1)
          orderFilled.should.equal(true)
        })

        it('emits a "Trade event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Trade')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet address is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'tokenGive is correct')
          event.userFill.should.equal(user2, 'userFill is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
      })

      describe('failure', async () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 9999
          await exchange.fillOrder(invalidOrderId, {from: user2}).should.be.rejectedWith(EVM_REVERT)
        })
        
        it('rejects already filled orders', async () => {
          await exchange.fillOrder('1', {from: user2}).should.be.fulfilled
          await exchange.fillOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT)
        })
        
        it('rejects cancelled orders', async () => {
          await exchange.cancelOrder('1', {from:user1}).should.be.fulfilled
          await exchange.cancelOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })

    describe('cancelling orders', async () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder('1', { from: user1 })
        })

        it('updates cancelled orders', async () => {
          const orderCancelled = await exchange.orderCancelled(1)
          orderCancelled.should.equal(true)
        })

        it('emit an "Cancel" event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Cancel')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet address is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'tokenGive is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
      })

      describe('failure', async () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderid = 9999
          await exchange.cancelOrder(invalidOrderid, {from: user1}).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects unauthorized cancelations', async () => {
          // Try to cancel the order from another user
          await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
  })
})