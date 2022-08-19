const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    log("------------------------------------");

    let args = [];
    let ethUsdPriceFeedAddress;
    // priceFeed
    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator");
        ethUsdPriceFeedAddress = EthUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }
    // SVGs
    const lowSVG = await fs.readFileSync("./images/dynamic-svg-nft/sad.svg", {
        encoding: "utf-8",
    });
    const highSVG = await fs.readFileSync(
        "./images/dynamic-svg-nft/happy.svg",
        {
            encoding: "utf-8",
        }
    );
    args = [ethUsdPriceFeedAddress, lowSVG, highSVG];

    const dynamicSvgNft = await deploy("DynamicSVGNFT", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 6,
    });

    // verify
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API
    ) {
        log("Verifying...");
        await verify(dynamicSvgNft.address, args);
    }
};

module.exports.tags = ["all", "dynamic-svg-nft", "main"];
