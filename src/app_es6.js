import express from 'express'
import bodyParser from 'body-parser'
var rp = require('request-promise');
var StellarSdk = require('stellar-sdk');

/* Initialize app and configure bodyParser */
const port = process.env.PORT || 4000
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/* Stellar Interactions */
const createAccount = async (req, res) => {
  const pair = StellarSdk.Keypair.random()
  
  console.log(pair.secret())
  console.log(pair.publicKey())

  const account = rp.get({
    uri: 'https://horizon-testnet.stellar.org/friendbot',
    qs: { addr: pair.publicKey() },
    json: true
  }).then((response, second) => {
    console.log(response)
  }).then(() => {
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    
    // the JS SDK uses promises for most actions, such as retrieving an account
    return server.loadAccount(pair.publicKey())
  }).then((account) => {
    console.log('Balances for account: ' + pair.publicKey());
    account.balances.forEach(function(balance) {
      console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
    });
  }).catch((err) => { console.log(err) })

  res.send('App is running correctly!')
}

/* API Routes */
app.get('/', createAccount)

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
var server = app.listen(port, () => {
  console.log(`Stellar test app listening on port ${port}!`)
})
