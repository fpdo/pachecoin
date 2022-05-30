import { tokens, EVM_REVERT } from './helpers'
const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Token', ([deployer, receiver, exchange]) => {
  let token
  const name = 'PacheCoin'
  const symbol = 'PCH'
  const decimals = '18'
  // totalSupply = 1000000 * 10 ** 18
  const totalSupply = tokens(1000000).toString()

  beforeEach(async () => {
    // Fetch token
    token = await Token.new()
  })

  describe('deployment', () => {
    it('tracks the name', async () => {
      // Read token name
      const result = await token.name()
      // Token name is test
      result.should.equal(name)
    })
    it('tracks the symbol', async () => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })
    it('tracks the decimals', async () => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })
    it('tracks the total supply', async () => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply.toString())
    })
    it('tracks total supply to deployer', async () => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply.toString())
    })
  })

  describe('delegated tokens transfer', () => {
    let amount
    let result

    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(100)
        // Transfer
        result = await token.transfer(receiver, amount, { from: deployer })
      })

      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })
      it('emits a Transfer event', () => {
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Transfer')
        event._from.toString().should.equal(deployer, '_from is correct')
        event._to.toString().should.equal(receiver, '_to is correct')
        event._value.toString().should.equal(amount.toString(), '_value is correct')
      })
    })

    describe('failure', () => {
      it('rejects insufficient balances', async () => {
        let invalidAmount
        // Try to transfer more tokens than you have
        invalidAmount = tokens(100000000) // 100 million - greater than total supply
        await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT)

        // Try to transfer tokens from an empty account
        invalidAmount = tokens(10) // receiver has no tokens
        await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects invalid receivers', async () => {
        await token.transfer(0x00, amount, { from: deployer }).should.be.rejected
      })
    })
  })

  describe('approving tokens', () => {
    let amount
    let result
    beforeEach(async () => {
      amount = tokens(100)
      result = await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', () => {
      it('allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(amount.toString())
      })
      it('emits a Approval event', () => {
        const log = result.logs[0]
        const event = log.args
        log.event.should.eq('Approval')
        event._owner.toString().should.equal(deployer, '_onwer is correct')
        event._spender.toString().should.equal(exchange, '_spender is correct')
        event._value.toString().should.equal(amount.toString(), '_value is correct')
      })
    })
    describe('failure', () => {
      it('rejects invalid spender', async () => {
        await token.approve(0x00, amount, { from: deployer }).should.be.rejected
      })
    })
  })

  describe('transfer from tokens', () => {
    let amount
    let approveResult
    let transferResult
    beforeEach(async () => {
      amount = tokens(100)
      approveResult = await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', () => {
      beforeEach(async () => {
        transferResult = await token.transferFrom(deployer, receiver, amount, { from: exchange })
      })
      it('emits a Approval event', () => {
        const log = approveResult.logs[0]
        const event = log.args
        log.event.should.eq('Approval')
        event._owner.toString().should.equal(deployer, '_onwer is correct')
        event._spender.toString().should.equal(exchange, '_spender is correct')
        event._value.toString().should.equal(amount.toString(), '_value is correct')
      })
      it('emits a Transfer event', () => {
        const log = transferResult.logs[0]
        const event = log.args
        log.event.should.eq('Transfer')
        event._from.toString().should.equal(deployer, '_from is correct')
        event._to.toString().should.equal(receiver, '_to is correct')
        event._value.toString().should.equal(amount.toString(), '_value is correct')
      })
      it('transfer from deployer to receiver', async () => {
        let balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(amount.toString())
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
      })
      it('resets the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })
    })

    describe('failure', () => {
      it('reject invalid _from', async () => {
        await token.transferFrom(0x00, receiver, amount, { from: exchange }).should.be.rejected
      })
      it('reject invalid _to', async () => {
        await token.transferFrom(deployer, 0x00, amount, { from: exchange }).should.be.rejected
      })
      it('rejects insufficient balances', async () => {
        let invalidAmount
        // Try to transfer more tokens than you have
        invalidAmount = tokens(100000000) // 100 million - greater than total supply
        await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)

        // Try to transfer tokens from an empty account
        invalidAmount = tokens(10) // receiver has no tokens
        await token.transferFrom(receiver, deployer, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
      })
      it('rejects over allowed value', async () => {
        let overAllowance = tokens(110)
        await token.transferFrom(deployer, receiver, overAllowance, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })
})