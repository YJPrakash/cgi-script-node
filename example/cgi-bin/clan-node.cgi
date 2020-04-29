#!/usr/bin/env node

const CgiHttpContext = require('./cgi-node');
let cgi = new CgiHttpContext();

let { request, response } = cgi;
const isValidIP = require('pp-ipcheck');

function main(){
  let {ip} = request;

  resquest.set({'Content-type': 'text/plain'});

	if (isValidIP(ip)) {
	  response.write("101\t\t1");
	} else {
	  response.write("101\t\t-1");
  } 
  
  response.end();
}

if(request.method == "GET"){
  main();
} else if (request.method == 'POST') {
  request.readPost(main);
}