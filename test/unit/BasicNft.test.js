const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT tests", () => {
          let owner, basicNft;

          beforeEach(async () => {
              accounts = await ethers.getSigners();
              owner = accounts[0];

              await deployments.fixture(["basic-nft"]);
              basicNft = await ethers.getContract("BasicNFT", owner);
          });

          describe("constructor", async () => {
              it("token counter is equal to 0", async () => {
                  const tokenCounter = await basicNft.getTokenCounter();
                  assert.equal(tokenCounter, 0);
              });
          });

          describe("main functions", async () => {
              it("Allow to mining NFT token, and update appropriately", async () => {
                  const tx = await basicNft.mintNft();
                  await tx.wait(1);
                  const tokenURI = await basicNft.tokenURI(0);
                  const tokenCounter = await basicNft.getTokenCounter();

                  assert.equal(tokenURI, await basicNft.TOKEN_URI());
                  assert.equal(tokenCounter, 1);
              });
          });
      });
