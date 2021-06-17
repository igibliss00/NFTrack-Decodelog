const functions = require("firebase-functions");
const Web3 = require("web3");
const purchaseABI = require("./contracts/PurchaseABI.json");
require('dotenv').config();
const infuraKeys = process.env.INFURA_API_KEY || ""
const web3 = new Web3(`wss://rinkeby.infura.io/ws/v3/${infuraKeys}`);

exports.decodeLog = functions.https.onRequest( async (request, response) => {
    const { hexString, topics } = request.body
    let decoded = web3.eth.abi.decodeLog(
      inputs,
      hexString,
      topics
    )

    response.send(decoded)
});

const inputs = [
  {
  "indexed": true,
  "internalType": "address",
  "name": "from",
  "type": "address"
  },
  {
  "indexed": true,
  "internalType": "address",
  "name": "to",
  "type": "address"
  },
  {
  "indexed": true,
  "internalType": "uint256",
  "name": "tokenId",
  "type": "uint256"
  }
]