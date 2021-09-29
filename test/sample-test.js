const { ethers } = require("hardhat");
const assert = require('assert')

describe("Depositor", function () {
  it("Should deposit tokens without approval", async function () {
    const [ owner ] = await ethers.getSigners();
    const Lighthouse = await ethers.getContractFactory("Lighthouse");
    const lighthouse = await Lighthouse.deploy(owner.address);
    await lighthouse.deployed();

    const Depositor = await ethers.getContractFactory('Depositor')
    const depositor = await Depositor.deploy(lighthouse.address)
    await depositor.deployed()

    const harborTx = await lighthouse.setHarbor(depositor.address)
    await harborTx.wait()

    const TestToken = await ethers.getContractFactory('TestToken')
    const testToken = await TestToken.deploy()
    await testToken.deployed()

    const mintTx = await testToken.connect(owner).mint(1000)
    await mintTx.wait()

    const depositAddress = await depositor.depositAddress(owner.address)

    const transferTx = await testToken.connect(owner).transfer(depositAddress, 1000)
    await transferTx.wait()

    const ingestTx = await depositor.claimByIgnorance(owner.address, testToken.address, 1000)
    await ingestTx.wait()

    const ownerTokenBalance = await testToken.balanceOf(owner.address)
    const depositorTokenBalance = await testToken.balanceOf(depositor.address)
    const ignorantTokenBalance = await testToken.balanceOf(depositAddress)

    console.log(`owner balance: ${ownerTokenBalance}`)
    console.log(`depositor balance: ${depositorTokenBalance}`)
    console.log(`ignorant balance: ${ignorantTokenBalance}`)
    assert.equal(+ownerTokenBalance, 0)
    assert.equal(+depositorTokenBalance, 1000)
    assert.equal(+ignorantTokenBalance, 0)
  });

  it("Should compare cost of performing transferFrom", async () => {
    const [ owner ] = await ethers.getSigners();
    const Depositor = await ethers.getContractFactory('Depositor')
    const depositor = await Depositor.deploy('0x0000000000000000000000000000000000000000')
    await depositor.deployed()

    const TestToken = await ethers.getContractFactory('TestToken')
    const testToken = await TestToken.deploy()
    await testToken.deployed()

    const mintAmount = 1249124
    const mintTx = await testToken.connect(owner).mint(mintAmount)
    await mintTx.wait()

    const approveTx = await testToken.connect(owner).approve(depositor.address, 1000)
    await approveTx.wait()

    const claimTx = await depositor.claimByTransfer(owner.address, testToken.address)
    await claimTx.wait()

    const ownerTokenBalance = await testToken.balanceOf(owner.address)
    const depositorTokenBalance = await testToken.balanceOf(depositor.address)

    assert.equal(+ownerTokenBalance, mintAmount - 1000)
    assert.equal(+depositorTokenBalance, 1000)
  })
});