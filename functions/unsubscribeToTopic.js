const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.unsubscribeToTopic = functions.https.onRequest(async (request, response) => {
    const {
        topic
    } = request.body;

    try {
        let ref = admin.firestore().collection("post").doc(topic);
        const doc = await ref.get();
        if (!doc.exists) {
            console.log("No such document!")
            response.status(200)
        } else {
            // console.log("doc.data(): ", doc.data());
            const post = doc.data()

            functions.logger.log(
                "topic", topic,
                "bidderTokens", post.bidderTokens
                );

            if (post.bidderTokens.length == 0) {
                response.status(200).send("OK");
            } else {
                // Unsubscribe the devices corresponding to the registration tokens from
                // the topic.
                admin.messaging().unsubscribeFromTopic(post.bidderTokens, topic)
                .then((res) => {
                    // See the MessagingTopicManagementResponse reference documentation
                    // for the contents of response.
                    functions.logger.log('Successfully unsubscribed from topic:', response);
                    response.status(200).send(res);
                })
                .catch((error) => {
                    functions.logger.log('Error unsubscribing from topic:', error);
                    response.status(500).send(error);
                });
            }
        }
    } catch (error) {
        response.status(500).send(error)
    }
})