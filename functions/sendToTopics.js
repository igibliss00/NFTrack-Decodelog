const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.sendToTopics = functions.https.onRequest(async (request, response) => {
    const {
        title,
        topic,
        content,
    } = request.body

    functions.logger.log(
        "request.body:",
        request.body,
    );

    const message = {
        notification: {
            title,
            body: content,
        },
        data: {
            docId: topic,
            messageType: "topic"
        },
        topic
    };
      
    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message)
    .then((res) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', res);
        response.status(200).send("OK");
    })
    .catch((error) => {
        console.log('Error sending message:', error);
        response.status(500).send(error);
    });
})