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
                const updatedTokens = deviceTokens.filter((token) => token !== deviceTokens[index]);
                console.log("updatedTokens", updatedTokens);
                try {
                    admin.firestore().collection("deviceToken").doc(recipient).set({
                        token: updatedTokens
                    })
                } catch (e) {
                    console.error("Error removing tokens", e);
                }
            }
        }
    });

    // response.status(200)
    response.status(200).send();
});