const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const express = require('express');
const engines = require('consolidate');

const firebaseApp = firebase.initializeApp(
  // use configured project's credentials
  functions.config().firebase
);

function getFacts () {
  // reference to facts in db
  const ref = firebaseApp.database().ref('facts');
  // get data one time
  // returns a promise, so chain then and get snapshot, and unwrap value
  return ref.once('value').then(snap => snap.val());
}

const app = express();
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

// cache content by setting cache control header
app.get('/', (request, response) => {
  // public - allows content to be cached on server also
  // private - allows content to be only cached on user's browser
  // max-age - how long we can store content in user's browser (seconds)
  // s-maxage - how long we can store content on CDN (seconds)
  response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  getFacts().then(facts => {
    response.render('index', { facts });
    return null;
  }).catch(error => {
    console.error(error);
    response.error(500);
  });
});

// json api with CDN caching layer
app.get('/facts.json', (request, response) => {
  response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  getFacts().then(facts => {
    response.json(facts);
    return null;
  }).catch(error => {
    console.error(error);
    response.error(500);
  });
});

// cloud functions
exports.app = functions.https.onRequest(app);
