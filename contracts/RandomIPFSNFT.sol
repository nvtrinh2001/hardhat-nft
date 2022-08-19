// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIPFSNFT__RangeOutOfBounds();
error RandomIPFSNFT__NotEnoughETHToSend();
error RandomIPFSNFT__TransferFailed();

contract RandomIPFSNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint an NFT, we will trigger a Chainlink VRF call to get a random number
    // Using that number to get a random NFT
    // Get an NFT with a rareness:
    // - Super rare: pug
    // - Kinda rare: shiba
    // - More common: st. bernard

    // users have to pay to mint an NFT
    // the owner of the contract can withdraw the ETH

    // Type Declarations
    enum Breed {
        PUG,
        SHIBA,
        BERNARD
    }

    // VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal immutable i_mintFee;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) revert RandomIPFSNFT__NotEnoughETHToSend();

        requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert RandomIPFSNFT__TransferFailed();
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        // chainlink node will activate this function
        // => cannot use msg.sender bcs msg.sender = chainlink_node
        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;

        uint256 moddedNumber = randomWords[0] % MAX_CHANCE_VALUE;
        // 0-9: pug
        // 10-39: shiba
        // 40-99: st. bernard
        Breed dogBreed = getBreedFromModdedNumber(moddedNumber);
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(
            newTokenId,
            /* that breed's tokenURI */
            s_dogTokenUris[uint256(dogBreed)]
        );
        s_tokenCounter += 1;

        emit NftMinted(dogBreed, nftOwner);
    }

    function getBreedFromModdedNumber(uint256 moddedNumber)
        public
        pure
        returns (Breed)
    {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();

        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedNumber >= cumulativeSum &&
                moddedNumber < cumulativeSum + chanceArray[i]
            ) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIPFSNFT__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        // 0: 10%
        // 1: 30%
        // 2: 60%
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getSenderFromRequestId(uint256 requestId)
        public
        view
        returns (address)
    {
        return s_requestIdToSender[requestId];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index)
        public
        view
        returns (string memory)
    {
        return s_dogTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getKeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    // _setTokenURI do this for us
    // function tokenURI(uint256) public view override returns (string memory) {}
}
