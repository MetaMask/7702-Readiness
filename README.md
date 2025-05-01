# MetaMask 7702/5792 Readiness

This test dapp allows you to test the 7702/5792 functionality of MetaMask on a chain that supports it. At the point of publishing this, 7702 is supported on Sepolia Testnet and Gnosis Mainnet

The dapp demonstrates the following user flows:
- Upgrading an EOA to a Smart Account (EIP-7702)
- Checking the capabilities of the wallet for a selected chain (ERC-5792)
- Submitting multiple transactions in a single batch (ERC-5792)
- Checking the status of the submitted batch transactions (ERC-5792)
- Downgrading your account back to an EOA (MetaMask -> Account Details -> Downgrade)

## Running the project

To run the project, clone it locally and then run
```js
yarn install
yarn dev
```