# MetaMask 7702/5792 Readiness

This test dapp allows you to test the 7702/5792 functionality of MetaMask on a chain that supports it. At the point of publishing this, 7702 is supported on Sepolia Testnet and Gnosis Mainnet

The dapp demonstrates the following user flows:
- Upgrading an EOA to a Smart Account
- Submitting multiple transactions in a single batch
- Downgrading your account back to an EOA (MetaMask -> Account Details -> Downgrade)

## Running the project

To run the project, clone it locally and then run
```js
yarn install
yarn dev
```