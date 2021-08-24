const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.sendStatusNotification = functions.https.onRequest(async (request, response) => {
    const { 
        sender, 
        recipient, 
        content, 
        docID 
    } = request.body
     
    functions.logger.log(
        "docID:",
        docID,
    );

    // Get the list of device notification tokens.
    let deviceTokens; let ref;
    try {
        ref = admin.firestore().collection("deviceToken").doc(recipient);
        const doc = await ref.get();
        if (!doc.exists) {
            console.log("No such document!");
            response.status(500).send(e)
        } else {
            console.log("doc.data():", doc.data());
            deviceTokens = doc.data().token;
        }
    } catch (e) {
        response.status(500).send(e)
    }

    let senderProfile;
    try {
        senderProfile = await admin.auth().getUser(sender);
        console.log("senderProfile", senderProfile);
    } catch (e) {
        console.log(e);
        response.status(500).send(e)
    }

    // Notification details.
    let payload = {
        notification: {
            title: senderProfile.displayName,
            body: content,
            // icon: senderProfile.photoURL == nil ? "" : senderProfile.photoURL,
            sound: "default",
        },
        data: {
            uid: senderProfile.uid,
            displayName: senderProfile.displayName,
            // photoURL: senderProfile.photoURL == nil ? "" : senderProfile.photoURL,
            docID,
            messageType: "status"
        }
    };

    functions.logger.log(
        "deviceTokens", deviceTokens,
        "payload", payload,
        );

    // Send notifications to all tokens.
    const messageResponse = await admin.messaging().sendToDevice(deviceTokens, payload);
    // For each message check if there was an error.
    messageResponse.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            functions.logger.error(
                "Failure sending notification to",
                deviceTokens[index],
                error,
            );
        // Cleanup the tokens who are not registered anymore.
            if (error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered") {
                const updatedTokens = deviceTokens((token) => token !== deviceTokens[index]);
                console.log("updatedTokens", updatedTokens);
                ref.update({
                    token: updatedTokens,
                })
                .catch(function(e) {
                    console.error("Error removing tokens", e);
                    response.status(500).send(e)
                });
            }
        }
    });
    response.status(200)
});

    // firebase deploy --only "functions:sendStatusNotification.sendStatusNotification"

    // exports.sendStatusNotification = functions.firestore
    // .document("/post/{docId}")
    // .onUpdate(async (change, context) => {
    //     const newValue = change.after.data()
    //     const docId = context.params.docId;

    //     functions.logger.log(
    //         "newValue:",
    //         newValue,
    //     );

    //     let recipient, sender, content;
    //     switch (newValue.status) {
    //         case "pending":
    //             // purchased so the buyer needs to notify the seller
    //             sender = newValue.buyerUserId;
    //             recipient = newValue.sellerUserId;
    //             content = "Your item has been purchased!"
    //             break;
    //         case "transferred":
    //             // seller has to notify the buyer
    //             sender = newValue.sellerUserId;
    //             recipient = newValue.buyerUserId;
    //             content = "Your item has been transferred!"
    //             break
    //         case "complete":
    //             // buyer has to notify the seller
    //             sender = newValue.buyerUserId;
    //             recipient = newValue.sellerUserId;
    //             content = "Your item has been received!"
    //             break
    //         default:
    //             break;
    //     }

    //     // Get the list of device notification tokens.
    //     let deviceTokens; let ref;
    //     try {
    //         ref = admin.firestore().collection("deviceToken").doc(recipient);
    //         const doc = await ref.get();
    //         if (!doc.exists) {
    //             console.log("No such document!");
    //         } else {
    //             console.log("doc.data():", doc.data());
    //             deviceTokens = doc.data().token;
    //         }
    //     } catch (e) {
    //         console.log(e);
    //     }

    //     let senderProfile;
    //     try {
    //         senderProfile = await admin.auth().getUser(sender);
    //         console.log("senderProfile", senderProfile);
    //     } catch (e) {
    //         console.log(e);
    //     }

    //     let newData = {
    //         buyerHash: newValue.buyerHash,
    //         buyerUserId: newValue.buyerUserId,
    //         category: newValue.category,
    //         confirmPurchaseHash: newValue.confirmPurchaseHash,
    //         date: String(newValue.date),
    //         description: newValue.description,
    //         escrowHash: newValue.escrowHash,
    //         itemIdentifier: newValue.itemIdentifier,
    //         mintHash: newValue.mintHash,
    //         price: newValue.price,
    //         sellerUserId: newValue.sellerUserId,
    //         senderAddress: newValue.senderAddress,
    //         status: newValue.status,
    //         title: newValue.title
    //     }

    //     if (newValue.hasOwnProperty("confirmPurchaseDate")) {
    //         newData["confirmPurchaseDate"] = String(newValue.confirmPurchaseDate)
    //     }

    //     if (newValue.hasOwnProperty("transferDate")) {
    //         newData["transferDate"] = String(newValue.transferDate)
    //     } 

    //     if (newValue.hasOwnProperty("confirmReceivedDate")) {
    //         newData["confirmReceivedDate"] = String(newValue.confirmReceivedDate)
    //     }

    //     // Notification details.
    //     let payloadData = {
    //         uid: senderProfile.uid,
    //         displayName: senderProfile.displayName,
    //         photoURL: senderProfile.photoURL,
    //         docId,
    //     }
    //     const data = Object.assign(payloadData, newData)

    //     let payload = {
    //         notification: {
    //             title: senderProfile.displayName,
    //             body: content,
    //             icon: senderProfile.photoURL,
    //             sound: "default",
    //         },
    //         data
    //     };

    //     functions.logger.log(
    //         "deviceTokens", deviceTokens,
    //         "payload", payload,
    //         );

    //     // Send notifications to all tokens.
    //     const response = await admin.messaging().sendToDevice(deviceTokens, payload);
    //     // For each message check if there was an error.
    //     response.results.forEach((result, index) => {
    //         const error = result.error;
    //         if (error) {
    //             functions.logger.error(
    //                 "Failure sending notification to",
    //                 deviceTokens[index],
    //                 error,
    //             );
    //         // Cleanup the tokens who are not registered anymore.
    //             if (error.code === "messaging/invalid-registration-token" ||
    //                     error.code === "messaging/registration-token-not-registered") {
    //                 const updatedTokens = deviceTokens((token) => token !== deviceTokens[index]);
    //                 console.log("updatedTokens", updatedTokens);
    //                 ref.update({
    //                     token: updatedTokens,
    //                 })
    //                 .catch(function(err) {
    //                     console.error("Error removing tokens", err);
    //                 });
    //             }
    //         }
    //     });
    //     return;
    // });