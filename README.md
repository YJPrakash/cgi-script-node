# A simple cgi module for running Node.js in apache server

## Usage:

Installing CGI module for apache server work with nodejs as a cgi script.
```
$ npm install cgi-node
```

Following way to use the CGI script in apache server 
```js
#!/usr/bin/env node

const CgiHttpContext = require('cgi-node');

const {CgiNodeInfo, request} = new CgiHttpContext();

request.readPost(function(){
  request.parsePost();
  CgiNodeInfo();
});
```

## with request method

Here onReady is a callback function here we write the response for the request
```js
//  require ('cgi-node')
const {request, response} = new CgiHttpContext();  

function onReady(){
  // Parse the request form data or request url (quesrystring)
  request.parsePost();

  // respond with console.log function set Headers and write the body of html content
  console.log('Content-Type: text/html');
  console.log();
  console.log('<h3>Helloworld!</h3>');
  
  // (OR) respond with response object set Headers and write the body of plain content 
  response.set('Content-type', 'text/plain');
  response.write('Helloworld');
  response.end();

  // (OR) respond with response object set Headers and write body of JSON content
  response.set({
    'Content-type': 'application/json'
  });
  response.json({
    msg: 'Helloworld!'
    body: request.body, // request form fields are stored in json object
    files: request.files // request form fiels are stored in json object
    url: request.url,
    ip: request.ip // remote-address
  });
  response.end();
}

if(request.method == 'GET'){
  // questring
  onReady();
} else if (request.method == 'POST') {
  // form data 
  request.readPost(onReady);
}
```

## Here I include the some examples for simple cgi form request

- Copy the .cgi files into the cgi-bin dir. and also cgi-node.js
```
$ sudo cp -f hello.cgi /usr/lib/cgi-bin/
```
- Change the modes of cgi files
```
$ sudo chmod a+x /usr/lib/cgi-bin/hello.cgi
```
- Copy index.html into the var/www/ folder use the following command
```
$ sudo mkdir /var/www/html/node
$ sudo cp -f index.html /var/www/html/node/
```
- Then visit url http://127.0.0.1/node to your favourite browser
- After posting the form check the console or response of the request in network panel by the developer tool