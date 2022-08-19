const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullImagesPath);
    console.log("Uploading to IPFS...");
    let responses = [];
    for (fileIndex in files) {
        console.log(`Working on ${fileIndex}...`);
        const readableStreamForFile = fs.createReadStream(
            `${fullImagesPath}/${files[fileIndex]}`
        );
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile);
            responses.push(response);
        } catch (e) {
            console.log(e);
        }
    }
    return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { storeImages, storeTokenUriMetadata };
