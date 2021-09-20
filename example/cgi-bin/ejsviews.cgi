#!/usr/bin/env node

const CgiHttpContext = require('./cgi-node');
const cgi = new CgiHttpContext();
const {
  request,
  response
} = cgi;

if (request.method == 'GET') {
  main();
} else if (request.method == 'POST') {
  request.readPost(main);
}

function main() {
  // EJS config option root path of views directory mention in as options object.
  
  // let ejsOptions = {
  //   async: false,
  //   root: request.server['document-root'] + 'views'
  // };

  // This method directly read the ejs template file 
  /*response.renderFile(`${__dirname}./about`, (...param), ejsOptions, function (err, ejsStr){
    ...
    response.write('');
  });*/

  // This method specify the template file name CGI script handles the rendering operation of template.
  response.render(`about`, {title: 'About', body: 'Welcome to EJS'});
  
  response.end();

}
