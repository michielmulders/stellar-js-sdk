# Stellar Lumens JavaScript SDK
Playing with Stellar JavaScript SDK - Stellar Lumens: ES7 async/await example.
This example creates two accounts on the testnet and let's the friendbot give them testnet tokens.
Next, we transfer a small amount from one account to another.

## Installation
Execute in terminal inside the root of the project:
`yarn install`
`npm install`

## Start & Usage
Again in terminal at root:
`npm start`

1. To create the accounts, execute a POST request to `http://localhost:4000/`.
2. Next, let's tranfer money from `accountA` to `accountB` by sending a POST request to `http://localhost:4000/payment`.
Watch your terminal to see the output logs.
3. Retrieve history for `accountA` by sending GET request to `http://localhost:4000/getHistory`.

If you have problems, create an issue on this repo. Thanks! :)
