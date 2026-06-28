const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./firebase.json'))
});
admin.firestore().collection('appointments').get().then(s => {
  console.log(JSON.stringify(s.docs.map(d => d.data()), null, 2));
}).catch(console.error);
