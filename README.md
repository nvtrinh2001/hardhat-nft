# NFT Fundamentals

Create and interact with three different kinds of NFT.

**3 NFT contracts**

1. Basic NFT: using ERC-721 token
2. Random IPFS hosted NFT

Using Chainlink VRF to generate a random NFT based on given success rates

-   Pros: Cheap
-   Cons: someone needs to pin our data

3. Dynamic SVG on-chain NFT

-   Pros: data is on chain
-   Cons: much more expensive
-   Dynamic:

*   If ETH price > X => happy face
*   If ETH price < X => sad face
*   Using Chainlink Price Feeds to detemine the price

# Getting Started

## Requirements

-   [git](https://git-scm.com/)
-   [nodejs](https://nodejs.org/)
-   [yarn](https://yarnpkg.com/)

## Quick Start

```
git clone git@github.com:nvtrinh2001/hardhat-nft.git
cd hardhat-nft
yarn
```

# Deploy

## Deploy on hardhat network

`yarn hardhat deploy`

## Deploy on a Testnet or a Mainnet

1. Setup environment variables

Add all variables into `.env` file, similar to what is in `env.example`

2. Get testnet ETH

Go to [faucets.chain.link](https://faucets.chain.link) and get some testnet ETH & LINK.

3. Setup a Chainlink VRF Subscription ID

Go to [vrf.chain.link](https://vrf.chain.link) and create a new subscription.

After that, run:

```
yarn hardhat deploy --network rinkeby --tags main
```

Only run with `tag: main` as we have to add contract address to Chainlink VRF Consumer in the next step.

4. Add your contract address as a Chainlink VRF Consumer

5. Mint NFTs

`yarn hardhat deploy --network rinkeby --tags mint`

# Test Coverage

```
yarn hardhat coverage
```

# Verify on Etherscan

Get the etherscan API key and put it in the _.env_ file. The token will be automatically verified by running the deployment scripts.
