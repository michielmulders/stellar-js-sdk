import express from 'express'
import bodyParser from 'body-parser'
import rp from 'request-promise'
import Stellar from 'stellar-sdk'

/* Initialize app and configure bodyParser */
const port = process.env.PORT || 4000
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/* Global Vars */
const server = new Stellar.Server('https://horizon-testnet.stellar.org')
Stellar.Network.useTestNetwork()

let pairA = Stellar.Keypair.random()
let pairB = Stellar.Keypair.random()
let accountA, accountB = null

/* Stellar Interactions */
const createAccount = async (req, res) => {  
  // Create Account and request balance on testnet
  await rp.get({
    uri: 'https://horizon-testnet.stellar.org/friendbot',
    qs: { addr: pairA.publicKey() },
    json: true
  })

  accountA = await server.loadAccount(pairA.publicKey()) // Load newly created account

  // Print balances at account.balances[0].balance
  console.log('\nBalances for account: ' + pairA.publicKey())
  accountA.balances.forEach((balance) => {
    console.log('Type:', balance.asset_type, ', Balance:', balance.balance)
  })

  accountB = await rp.get({
    uri: 'https://horizon-testnet.stellar.org/friendbot',
    qs: { addr: pairB.publicKey() },
    json: true
  })

  accountB = await server.loadAccount(pairB.publicKey()) // Load newly created account

  // Print balances at account.balances[0].balance
  console.log('\nBalances for account: ' + pairB.publicKey())
  accountB.balances.forEach((balance) => {
    console.log('Type:', balance.asset_type, ', Balance:', balance.balance)
  })

  res.send("Account A created!")
}

/* Initiate payment from acc A to acc B */
const makePayment = async (req, res) => {
  const transaction = new Stellar.TransactionBuilder(accountA)
    .addOperation(Stellar.Operation.payment({
      destination: pairB.publicKey(),
      asset: Stellar.Asset.native(),
      amount: '30.0000001'
    }))
    .build()

  transaction.sign(pairA)
  console.log("\nXDR format of transaction: ", transaction.toEnvelope().toXDR('base64'))

  try {
    const transactionResult = await server.submitTransaction(transaction)

    console.log('\n\nSuccess! View the transaction at: ')
    console.log(transactionResult._links.transaction.href)
    console.log(JSON.stringify(transactionResult, null, 2))
    
    res.send("Transaction successful!")
  } catch (err) {
    console.log('An error has occured:')
    console.log(err)
    res.send("Transaction failed")
  }
}

/* API Routes */
app.get('/', createAccount)
app.get('/payment', makePayment)

/* CORS */
app.use((req, res, next) => {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type')

  // Pass to next layer of middleware
  next()
})

/* Serve API */
var instance = app.listen(port, () => {
  console.log(`Stellar test app listening on port ${port}!`)
})
