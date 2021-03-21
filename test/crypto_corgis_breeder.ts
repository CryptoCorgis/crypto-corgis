import range from "lodash.range";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { CryptoCorgisBreeder } from "../typechain";
import { blockNumberToDnaHex, isMutantBlockNumber, priceForCorgi } from "../index";

const FAKE_URI = "https://myuri.com";

describe("CryptoCorgisBreeder", () => {
  let accounts: Signer[];
  let cryptoCorgisBreeder: CryptoCorgisBreeder;
  let deployer: Signer;
  let minter: Signer;
  let minter2: Signer;
  let treasury: Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
    minter2 = accounts[2];
    treasury = accounts[3];
  });

  beforeEach(async () => {
    const BreederFactory = await ethers.getContractFactory("CryptoCorgisBreeder");
    cryptoCorgisBreeder = (await BreederFactory.deploy(FAKE_URI, FAKE_URI, await treasury.getAddress())) as any;
    await cryptoCorgisBreeder.deployed();
    // Make sure the sender is a new account, not the deployer.
    cryptoCorgisBreeder = await cryptoCorgisBreeder.connect(minter);
  });

  it("reverts if the block number isn't allowed", async () => {
    const minterAddress = await minter.getAddress();
    await expect(
      cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](123, minterAddress, 1, []),
    ).to.be.revertedWith("CryptoCorgisBreeder: Not allowed to mint for that block number");
  });

  it("reverts if not enough funds are sent", async () => {
    const minterAddress = await minter.getAddress();
    const blockNumber = await ethers.provider.getBlockNumber();
    const mintPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](blockNumber, minterAddress, 1, [], {
      value: 1e13,
    });
    await expect(mintPromise).to.be.revertedWith("CryptoCorgisBreeder: Insufficient funds to mint a Crypto Corgi");
  });

  it("successfully mints if all conditions are met", async () => {
    const minterAddress = await minter.getAddress();
    const blockNumber = await ethers.provider.getBlockNumber();
    const initialTreasuryBalance = await treasury.getBalance();
    const mintResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mintResultPromise).to.not.be.reverted;
    expect(await cryptoCorgisBreeder.balanceOf(minterAddress, blockNumber)).to.eq(1);
    expect(await cryptoCorgisBreeder.corgiNumberToBlockNumber(1)).to.eq(blockNumber);
    expect(await cryptoCorgisBreeder.blockNumberToCorgiNumber(blockNumber)).to.eq(1);
    expect(await treasury.getBalance()).to.eq(initialTreasuryBalance.add("10000000000000000"));
  });

  it("cannot mint two corgis of the same blockNumber", async () => {
    // Corgi 1
    const minterAddress = await minter.getAddress();
    const blockNumber1 = await ethers.provider.getBlockNumber();
    const mint1ResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber1,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mint1ResultPromise).to.not.be.reverted;
    // Corgi 2
    const mint2ResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber1,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mint2ResultPromise).to.be.revertedWith(
      "CryptoCorgisBreeder: Not allowed to mint for that block number",
    );
  });

  it("successfully mints a mutant corgi", async () => {
    const minterAddress = await minter.getAddress();
    const blockNumber = 115;
    // need to artificially inflate blocknumber
    for (const block in range(blockNumber)) {
      await cryptoCorgisBreeder.connect(deployer).setURI("nothing");
    }
    const initialTreasuryBalance = await treasury.getBalance();
    const mintResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    const [_, id] = isMutantBlockNumber(blockNumber);
    await expect(mintResultPromise).to.not.be.reverted;
    expect(await cryptoCorgisBreeder.balanceOf(minterAddress, blockNumber)).to.eq(1);
    expect(await cryptoCorgisBreeder.corgiNumberToBlockNumber(1)).to.eq(blockNumber);
    expect(await cryptoCorgisBreeder.mutantCorgiIdToBlockNumber(id)).to.eq(blockNumber);
    expect(await cryptoCorgisBreeder.blockNumberToCorgiNumber(blockNumber)).to.eq(1);
    const expectedMapping = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      blockNumber,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];
    expect(await treasury.getBalance()).to.eq(initialTreasuryBalance.add("10000000000000000"));
  });

  it("successfully mints 3 corgis if all conditions are met", async () => {
    // Corgi 1
    const minterAddress = await minter.getAddress();
    const blockNumber1 = await ethers.provider.getBlockNumber();
    const initialTreasuryBalance = await treasury.getBalance();
    const mint1ResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber1,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mint1ResultPromise).to.not.be.reverted;
    // Corgi 2
    const blockNumber2 = await ethers.provider.getBlockNumber();
    const mint2ResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber2,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mint2ResultPromise).to.not.be.reverted;
    // Corgi 3
    const blockNumber3 = await ethers.provider.getBlockNumber();
    const mint3ResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber3,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );
    await expect(mint3ResultPromise).to.not.be.reverted;
    expect(await cryptoCorgisBreeder.balanceOf(minterAddress, blockNumber1)).to.eq(1);
    expect(await cryptoCorgisBreeder.balanceOf(minterAddress, blockNumber2)).to.eq(1);
    expect(await cryptoCorgisBreeder.balanceOf(minterAddress, blockNumber3)).to.eq(1);
    expect(await cryptoCorgisBreeder.corgiNumberToBlockNumber(1)).to.eq(blockNumber1);
    expect(await cryptoCorgisBreeder.corgiNumberToBlockNumber(2)).to.eq(blockNumber2);
    expect(await cryptoCorgisBreeder.corgiNumberToBlockNumber(3)).to.eq(blockNumber3);
    expect(await cryptoCorgisBreeder.blockNumberToCorgiNumber(blockNumber1)).to.eq(1);
    expect(await cryptoCorgisBreeder.blockNumberToCorgiNumber(blockNumber2)).to.eq(2);
    expect(await cryptoCorgisBreeder.blockNumberToCorgiNumber(blockNumber3)).to.eq(3);
    expect((await cryptoCorgisBreeder.getClaimedCorgis()).map(bn => bn.toNumber())).to.have.ordered.members([
      blockNumber1,
      blockNumber2,
      blockNumber3,
    ]);
    expect(await cryptoCorgisBreeder.corgisMinted()).to.eq(3);
    expect(await treasury.getBalance()).to.eq(initialTreasuryBalance.add("30300000000000000"));
  });

  it("only allows deployer to change meta-data", async () => {
    await expect(cryptoCorgisBreeder.setURI("test")).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(cryptoCorgisBreeder.setContractDataURI("test")).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("corgiDnas are computed correctly", async () => {
    const blockNumber = 123243;
    expect(await cryptoCorgisBreeder.dnaForBlockNumber(blockNumber)).to.eq(blockNumberToDnaHex(blockNumber));
  });

  it("isMutantCorgi works as expected", async () => {
    const blockNumbers = range(1000);
    for (const blockNumber of blockNumbers) {
      const [isMutantJs, mutantIdJs] = isMutantBlockNumber(blockNumber);
      const [isMutantSol, mutantIdSol] = await cryptoCorgisBreeder["isMutantCorgi(uint256)"](blockNumber);
      if (isMutantJs || isMutantSol) {
        console.log(blockNumber);
        console.log("js", isMutantJs, mutantIdJs);
        console.log("sol", isMutantSol, mutantIdSol);
      }
      expect(isMutantJs).to.eq(isMutantSol);
      expect(mutantIdJs).to.eq(mutantIdSol);
    }
  });

  it.only("priceForCorgi works as expected", async () => {
    const corgiNumbers1 = range(1, 100);
    for (const corgiNumber of corgiNumbers1) {
      const price = priceForCorgi(corgiNumber);
      const priceSol = await cryptoCorgisBreeder.priceForCorgi(corgiNumber);
      expect(price.toString()).to.eq(priceSol.toString());
    }
    const corgiNumbers2 = range(9900, 10000);
    for (const corgiNumber of corgiNumbers2) {
      const price = priceForCorgi(corgiNumber);
      const priceSol = await cryptoCorgisBreeder.priceForCorgi(corgiNumber);
      expect(price.toString()).to.eq(priceSol.toString());
    }
  });

  it("you are able to name a corgi", async () => {
    const minterAddress = await minter.getAddress();
    const blockNumber = await ethers.provider.getBlockNumber();
    const mintResultPromise = cryptoCorgisBreeder["mint(uint256,address,uint256,bytes)"](
      blockNumber,
      minterAddress,
      1,
      [],
      {
        value: "11000000000000000",
      },
    );

    await expect(mintResultPromise).to.not.be.reverted;
    await expect(cryptoCorgisBreeder.nameCorgi(blockNumber, "Doug")).to.not.throw;
    expect(await cryptoCorgisBreeder.corgiIdToName(blockNumber)).to.eq("Doug");
  });
});
