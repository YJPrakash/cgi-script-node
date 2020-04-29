#!/usr/bin/env node

const CgiHttpContext = require('./cgi-node');
const cgi = new CgiHttpContext();

let {request, response} = cgi;

function main(){
  // Response with JSON;
  response.json({
    succuess: 'OK'
  });
  response.end();
}

if(request.method == 'GET'){
  main();
} else if (request.method == 'POST') {
  request.readPost(main);
}
// request.readPost(main);

