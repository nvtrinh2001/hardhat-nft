const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");

const AMOUNT_SEND = "10000000000000000";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT tests", async () => {
          let vrfCoordinatorV2Mock, randomIpfsNft, chainId;

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["randomipfs", "mocks"]);

              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock"
              );
              randomIpfsNft = await ethers.getContract(
                  "RandomIPFSNFT",
                  deployer
              );
              chainId = network.config.chainId;
          });

          describe("constructor", async () => {
              it("initialize correctly", async () => {
                  const keyHash = await randomIpfsNft.getKeyHash();
                  const callbackGasLimit =
                      await randomIpfsNft.getCallbackGasLimit();
                  const tokenCounter = await randomIpfsNft.getTokenCounter();
                  const mintFee = await randomIpfsNft.getMintFee();

                  assert.equal(
                      keyHash.toString(),
                      networkConfig[chainId].keyHash
                  );
                  assert.equal(
                      callbackGasLimit.toString(),
                      networkConfig[chainId].callbackGasLimit
                  );
                  assert.equal(tokenCounter.toString(), 0);
                  assert.equal(
                      mintFee.toString(),
                      networkConfig[chainId].mintFee
                  );
              });
          });

          describe("requestNft", async () => {
              it("revert the transaction if not enough ETH", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIPFSNFT__NotEnoughETHToSend"
                  );
              });

              it("mapping requestId with the sender", async () => {
                  await randomIpfsNft.requestNft({
                      value: AMOUNT_SEND,
                  });
                  const owner = await randomIpfsNft.getSenderFromRequestId(1);

                  assert.equal(owner, deployer);
              });

              it("emit NftRequested event", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: AMOUNT_SEND })
                  ).to.emit(randomIpfsNft, "NftRequested");
              });
          });

          describe("fulfillRandomWords", async () => {
              it("mint a random nft when a random number is returned", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI(
                                  "0"
                              );
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter();
                              assert.equal(
                                  tokenUri.toString().includes("ipfs://"),
                                  true
                              );
                              assert.equal(tokenCounter.toString(), "1");
                              resolve();
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });
                      try {
                          const fee = await randomIpfsNft.getMintFee();
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: fee.toString(),
                              });
                          const requestNftReceipt =
                              await requestNftResponse.wait(1);
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });
      });
