const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Web3 = require("web3");
// const purchaseABI = require("./contracts/PurchaseABI.json");
require('dotenv').config();
const infuraKeys = process.env.INFURA_API_KEY || ""
const web3 = new Web3(`wss://rinkeby.infura.io/ws/v3/${infuraKeys}`);

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.decodeLog = functions.https.onRequest( async (request, response) => {
    const { hexString, topics, documentID } = request.body
    let decoded = web3.eth.abi.decodeLog(
      inputs,
      hexString,
      topics
    )

    console.log("decoded", decoded)
    console.log("tokenId", decoded.tokenId)
    const postRef = admin.firestore()
      .collection("post")
      .doc(documentID)

    postRef.get().then((doc) => {
      if(doc.exists) {
        postRef.update({ tokenId: decoded.tokenId })
        .catch(err => {
          console.log("Error", err)
          response.send("500")
        })
      }
    }).catch(err => {
      console.log("Internal server error", err)
      response.send("500")
    })

    response.send("200")
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
