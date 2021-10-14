const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.sendMessageNotification = functions.firestore
    .document("/chatrooms/{docId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const {
            sender,
            recipient,
            content,
        } = snap.data();
        const docId = context.params.docId;

        functions.logger.log(
            "sender:",
            sender,
            "recipient:",
            recipient,
        );

        // Get the list of device notification tokens.
        let deviceTokens; let ref;
        try {
            ref = admin.firestore().collection("deviceToken").doc(recipient);
            const doc = await ref.get();
            if (!doc.exists) {
                console.log("No such document!");
            } else {
                console.log("doc.data():", doc.data());
                deviceTokens = doc.data().token;
            }
        } catch (e) {
            console.log(e);
        }

        let senderProfile;
        try {
            senderProfile = await admin.auth().getUser(sender);
            console.log("senderProfile", senderProfile);
        } catch (e) {
            console.log(e);
        }

        // Notification details.
        const payload = {
            notification: {
                title: senderProfile.displayName,
                body: content,
                icon: senderProfile.photoURL,
                sound: "default",
            },
            data: {
                uid: senderProfile.uid,
                displayName: senderProfile.displayName,
                photoURL: senderProfile.photoURL,
                docId,
                messageType: "chat"
            },
        };

        functions.logger.log(
            "deviceTokens", deviceTokens,
            "payload", payload,
            );

        // Send notifications to all tokens.
        const response = await admin.messaging().sendToDevice(deviceTokens, payload);
        // For each message check if there was an error.
        // const tokensToRemove = [];
        response.results.forEach((result, index) => {
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
                    // tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                    const updatedTokens = deviceTokens.filter((token) => token !== deviceTokens[index]);
                    console.log("updatedTokens", updatedTokens);
                    ref.update({
                        token: updatedTokens,
                    })
                    .catch(function(e) {
                        console.error("Error removing tokens", e);
                    });
                }
            }
        });
        return;
    });