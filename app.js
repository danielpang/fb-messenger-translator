
/**
 * A Translator BOT for Facebook messenger
 * Created by Daniel Pang, 2018
 * http://www.danielpang.me
 *
 * Starter code provided by Facebook
 */

'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Imports dependencies and set up http server
const
  request = require('request-promise'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {

        handlePostback(sender_psid, webhook_event.postback);
      }

    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "dpang";

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function parse_msg(message){
	var ind = message.indexOf(':');
	var target_lang = message.substring(0, ind);
	var supported_langs = new Object();
	supported_langs['french'] = 'fr';
	supported_langs['german'] = 'gr';
	if (supported_langs.hasOwnProperty(target_lang.toLowerCase())){
		var params = new Object();
		params['target'] = supported_langs[target_lang.toLowerCase()];
		params['text'] = message.substr(ind + 1);
		return params;
	} else {
		return "";
	}
}

function validMessage(message){
	var ind = message.indexOf(':');
	if (ind <= 0){
		return false;
	} else if (parse_msg(message) == ""){
		return false;
	} else {
		return true;
	}
}

function handleMessage(sender_psid, received_message) {
  let response;
  let response_msg;
  // Checks if the message contains text and is valid
  if (received_message.text && validMessage(received_message.text)){
	console.log("Valid message")
	let params = parse_msg(received_message.text);
	console.log(params['target'])
	console.log(params['text'])
	response_msg = translate_message(params);
  } else {
	response_msg = `Sorry, didn't quite understand. To translate a message use target_language:message, ex: french:hi`;
  }

  response = {
	  "text": response_msg
  }
  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
	"messaging_type": "RESPONSE",
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages?access_token=" + PAGE_ACCESS_TOKEN,
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message: ' + response['text'] +  ' sent!!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

function translate_message(params){
	let request_body = {
		'q': params['text'],
		'target': params['target']
	}

	const options = {
		"uri": "https://translation.googleapis.com/language/translate/v2?key=" + GOOGLE_API_KEY,
		"method": "POST",
		"body": request_body,
		"json": true
	}
	request(options)
		.then(function(response){
			for (var i in response.data.translations){
				console.log(response.data.translations[i].translatedText);
				return response.data.translations[i].translatedText;
			}
      	})
		.catch(function (err){
			console.error("Unable to translate, error message: " + err);
		})
	return "Unable to translate, please try again"; 
}
