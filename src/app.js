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
    .addOperation(Stellar.Operation.payment({
      destination: pairB.publicKey(),
      asset: Stellar.Asset.native(),
      amount: '2.0005682'
    }))
    .build()

  transaction.sign(pairA)

  // Let's see the XDR (encoded in base64) of the transaction we just built
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

/* Retrieve transaction history for AccountA */
const getHistory = async (req, res) => {
  // Retrieve latest transaction
  let historyPage = await server.transactions()
    .forAccount(accountA.accountId())
    .call()

  console.log(`\n\nHistory for public key ${pairA.publicKey()} with accountID ${accountA.accountId()}:`)
  
  // Check if there are more transactions in history
  // Stellar only returns one (or more if you want) transaction
  let hasNext = true
  while(hasNext) {
    if(historyPage.records.length === 0) {
      console.log("\nNo more transactions!")
      hasNext = false
    } else {
      // Print tx details and retrieve next historyPage
      console.log("\nSource account: ", historyPage.records[0].source_account)
      let txDetails = Stellar.xdr.TransactionEnvelope.fromXDR(historyPage.records[1].envelope_xdr, 'base64')
      
      txDetails._attributes.tx._attributes.operations.map(operation => console.log(`Transferred amount: ${operation._attributes.body._value._attributes.amount.low} XLM`))
      historyPage = await historyPage.next()
    }
  }

  res.send("History retrieved successful!")
}

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

/* API Routes */
app.post('/', createAccount)
app.post('/payment', makePayment)
app.get('/getHistory', getHistory)

/* Serve API */
var instance = app.listen(port, () => {
  console.log(`Stellar test app listening on port ${port}!`)
})
