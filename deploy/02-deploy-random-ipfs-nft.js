const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/upload-to-pinata");
const imageLocation = "./images/random-nft";
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attribute: [
        {
            trait_type: "cuteness",
            value: 100,
        },
    ],
};

const FUND_AMOUNT = ethers.utils.parseEther("10");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    log("------------------------------------");
    let args = [];
    let vrfCoordinatorV2Address, subscriptionId, tokenUris;

    // Get the IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris();
    }

    // 1. With our own IPFS node
    // 2. Pinata
    // 3. NFT.storage

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }
    log("------------------------------------");

    args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].keyHash,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ];

    const randomIpfsNft = await deploy("RandomIPFSNFT", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("------------------------------------");

    // verify
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API
    ) {
        log("Verifying...");
        await verify(randomIpfsNft.address, args);
    }
};

async function handleTokenUris() {
    tokenUris = [];
    // store images in IPFS
    // store metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(
        imageLocation
    );
    for (index in imageUploadResponses) {
        // create metadata
        let tokenUriMetadata = { ...metadataTemplate };
        tokenUriMetadata.name = files[index].replace(".png", "");
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[index].IpfsHash}`;

        // upload the metadata
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        // store the JSON to IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        );
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    }

    console.log("Token URIs Uploaded! They are:");
    console.log(tokenUris);
    return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
