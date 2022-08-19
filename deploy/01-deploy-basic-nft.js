const { network, getNamedAccounts, deployments } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("------------------------------------");
    const args = [];
    const basicNft = await deploy("BasicNFT", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API
    ) {
        log("Verifying...");
        await verify(basicNft.address, args);
    }
};

module.exports.tags = ["all", "basic-nft", "main"];
