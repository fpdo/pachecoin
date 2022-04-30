import { tokens, EVM_REVERT } from './helpers'
const Token = artifacts.require('./Token')
require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Token', ([deployer, receiver]) => {
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
        it('tracks the decimals', async() => {
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

    describe('sending tokens', () => {
        let amount
        let result

        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(100)
                // Transfer
                result = await token.transfer(receiver, amount, {from: deployer})
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
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.toString().should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', () => {
            it('rejects insufficient balances', async () => {
                let invalidAmount
                // Try to transfer more tokens than you have
                invalidAmount = tokens(100000000) // 100 million - greater than total supply
                await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT)
            
                // Try to transfer tokens from an empty account
                invalidAmount = tokens(10) // receiver has no tokens
                await token.transfer(deployer, invalidAmount, {from: receiver}).should.be.rejectedWith(EVM_REVERT) 
            })
            it('rejects invalid receivers', async() => {
                await token.transfer(0x00, amount, {from: deployer}).should.be.rejected
            })
        })
    })
})