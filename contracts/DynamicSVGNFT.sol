// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSVGNFT is ERC721 {
    // mint
    // store SVG information somewhere
    // logic to show X image or Y image

    uint256 private s_tokenCounter;
    string private i_lowImageUri;
    string private i_highImageUri;
    string private constant base64EncodedSvgPrefix =
        "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToChangeSvgValue;

    event CreatedNFT(uint256 indexed tokenId, int256 changeSvgValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        i_lowImageUri = svgToImageUri(lowSvg);
        i_highImageUri = svgToImageUri(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageUri(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        // abi.encodePacked(arg); return bytes
        // more can find in cheatsheet
        return
            string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI Query for nonexistent token");
        string memory imageURI = i_lowImageUri;

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        if (price >= s_tokenIdToChangeSvgValue[tokenId]) {
            imageURI = i_highImageUri;
        }

        // data:image/svg+xml;base64,
        // data:application/json;base64,
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description":"An NFT that changes based on Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image": "',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function mintNft(int256 changeSvgValue) public {
        s_tokenIdToChangeSvgValue[s_tokenCounter] = changeSvgValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;

        emit CreatedNFT(s_tokenCounter, changeSvgValue);
    }
}
