#!/usr/bin/env -S NODE_OPTIONS="--napi-modules" node

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const CGI_ENV = {
  ...process.env
};
process.env.REMOTE_ADDR = (process.env.HTTP_X_FORWARDED_FOR !== undefined) ? process.env.HTTP_X_FORWARDED_FOR : process.env.REMOTE_ADDR;

/*
The MIT License (MIT)

Copyright (c) 2020 Jeyaprakash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@Author: Jeyaprakash
@Email: anthony.jeyaprakash@gmail.com

 This is the VM context that will be used to run the requested scripts. 
 The CGI Context defines the global methods and variables that will be available for the executing scripts.
*/
function CgiHttpContext(onFinished) {
  let self = this;
  // self.stdin = process.stdin;
  // self.stdout = process.stdout;
  // self.stderr = process.stderr;
  self.on = process.on;
  /*
   This array contains all the scripts that have been included within the session.
   The script structure is: {id: <integer>, path: <string>, code: <string>, content: [<string>]};
  */
  this.__scripts = [];

  /*
   This is the VM context/sandbox used for every included script.
  */
  this.__vmContext = null;

  /*

   This object is created before the requested script is executed. It represents the HTTP request
   and contains all the request information. This includes the headers, URL, query string, post data
   and server information.
   
   See CgiHttpRequest for more details.
  */
  this.request = new CgiHttpRequest(onFinished);

  /*
   This object is created by the initially that implements header and write methods to send data back to the 
   client.
   
   See CgiHttpResponse for more details.
  */
  this.response = new CgiHttpResponse();

  /*
   This is an alias to the response.write method.
   Can be used directly within CGI script, example: write('Hello World')
  */
  this.write = this.response.write;

  /*
   The node process object is made available to the scripts for any additional information they may require.
   See http://nodejs.org/documentation/api/ under "process" for more information.
  */
  this.process = process;
  this.require = require;

  this.runScript = function (filePath, options) {
    // If options is not defined then assume UTF8 as including.
    if (options === undefined) options = {
      encoding: 'utf8'
    };

    // // Resolve the script path.
    // const path = self.mapPath(filePath);

    // Get the script file content.
    // const content = FS.readFileSync(path, options);
    let content = `require("${filePath}").getResponse();`;

    // If the file extension is not '.js' then parse out the different code and content sections.
    // TODO: use the configuration object to check if it is a script file or not.
    if (path.extname(filePath) != '.node') {
      script = CgiParser.script(self.__scripts.length, filePath, content.toString());
    }
    // else if (Path.extname(filePath) != '.js') script = CgiParser.script(self.__scripts.length, path, content.toString());

    // Otherwise just create a new script object
    else script = {
      id: self.__scripts.length,
      path: filePath,
      script: null,
      code: content,
      content: []
    };

    // Push the script onto the global script array.
    self.__scripts.push(script);

    // If the VM context has not yet been created then create it.
    if (self.__vmContext === null) self.__vmContext = VM.createContext(self);

    // Execute the script within the context.
    VM.runInContext(script.code, self.__vmContext, script.path);
  };

}

/*
The MIT License (MIT)

Copyright (c) 2020 Jeyaprakash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@Author: Jeyaprakash
@Email: anthony.jeyaprakash@gmail.com

 The HTTP response is an object that contains response header and content methods to 
 return valid HTTP response to the client.
*/
function CgiHttpResponse() {
  let self = this;

  /*
   Defines if the HTTP headers have already been sent or not. The user can choose to send the 
   headers manually by calling sendHeaders, or it is done automatically the first time the 'write' method
   is called.
  */
  this.headerSent = false;

  /*
   This object defines the list of name/value header of the HTTP headers. These can be manipulated directly
   by the caller. Set, get, remove methods are not required send the caller can access the header object directly.

   For reference purposes, here are the headers operations:
   Set: response.headers[ '<name>' ] = <value>;
   Get: response.headers[ '<name>' ];
   Remove: delete response.headers[ '<name>' ]
  */
  this.headers = {
    'content-type': 'text/html; charset=iso-8859-1'
  };

  /*
   Sends the current response.headers to the client if it has not yet been sent.
   After the header is sent it will not be sent again even if the method is called explicitly. 
   Headers changed within response.headers after the headers have been sent will not be sent.
  */
  this.sendHeaders = function () {
    // If the response has already been send then return;
    if (self.headerSent) return;

    // Set the header as sent and send it.
    self.headerSent = true;

    // Traverse the headers and output them 
    for (let name in self.headers) process.stdout.write(name + ':' + self.headers[name] + '\r\n');

    // Write the final new line.
    process.stdout.write('\r\n');
  };

  /*
   Writes the given string directly to the response output stream.
   If the headers have not yet been sent to the client, then sends them.
  */
  this.write = function (string) {
    // Send the headers if they not have been sent.
    self.sendHeaders();
    // Send the string to the client.
    process.stdout.write(string.toString());
    // return self;
  };

  // this.send = function(){

  // };

  this.json = function () {
    let jsonParsedObj = arguments[0] || {};

    // Send the headers if they not have been sent.
    self.set({
      'content-type': 'application/json'
    });
    self.sendHeaders();
    // Send the string to the client.
    process.stdout.write(JSON.stringify(jsonParsedObj));
    return self;
  };

  this.set = function () {
    let obj = {};
    if (arguments.length > 1) {
      obj[arguments[0]] = arguments[1];
    } else {
      obj = arguments[0] || {};
    }
    if (Object.keys(obj).length > 0) {
      for (let key in obj) {
        let value = obj[key];
        key = key.toLowerCase();
        this.headers[key] = value;
      }
    }
  };

  // this.get = function(key){
  // 	return this.headers[key.toLowerCase()];
  // };

  /*
   Sends any headers if not sent yet and exists the process.
  */
  this.end = function () {
    // If the header was not yet sent then send it.
    self.sendHeaders();

    // End the process.
    process.exit();
  };

  this.render = function (viewsPage, params, options) {
    let server = {},
      viewsRoot = "";
    CgiParser.enviromentVarialbesAndHeaders(process.env, server, {});
    viewsRoot = path.join(server['document-root'], 'views');
    if (options === undefined) {
      options = {
        async: false,
        root: viewsRoot
      };
    }

    try {
      self.set('Content-type', 'text/html');
      self.write(ejs.render(`<%- include('/${viewsPage}'); %>`, params, options));
    } catch (e) {
      self.set('Content-type', 'text/plain');
      self.write(e.message);
    }
  };

  this.renderFile = ejs.renderFile;
}


/*
The MIT License (MIT)

Copyright (c) 2020 Jeyaprakash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@Author: Jeyaprakash
@Email: anthony.jeyaprakash@gmail.com

 This object contains all the information about the process and the HTTP request sent by the client.
 The information is all parsed and easily accessible.
*/
function CgiHttpRequest() {
  let self = this;
  /*
   This is a URL object as defined by node.js API for URL found here: http://nodejs.org/api/url.html
   The URL is passed in as part of the environment variables 'request_uri'
  */
  this.url = null;

  /*
   The HTTP request method. Could be 'POST' or 'GET' (in upper-case). 
   Passed in as environment variable 'request_method'
  */
  this.method = null;

  /*
   Not sure if anyone ever uses this, but it is the HTTP version pass sent by the client.
   Passed in as environment variable 'server_protocol'
  */
  this.httpVersion = null;

  /*
   The parsed URL query string if any where provided. This is the same as getting it from the 'request.url.query'.
   See URL object for more information: http://nodejs.org/api/url.html
   
   In general (but not necessary), the query is a key/value pair of GET form.
  */
  this.query = {};

  /*
   This is the post object that holds all the different parts of the post data.
   form: The parsed post form data of name/value. If the POST is multi-part then any part with 'Content-Disposition: form-data;' is stored here.
   files: A list of uploaded files. The file object format is: {name: '', filename: '', contentType: '', data: ''}
   isMultiPart: true if content-type contains 'multipart/form-data' within it, otherwise false.
  */
  // this.post = {form:{}, files: [], parts: [], rawBody:'', data: [], isMultiPart: false};

  this.files = [];

  this.parts = [];

  this.rawBody = "";

  this.isMultiPart = false;

  /*
   This is the server environment variables as provided by 'process.env' except all 'HTTP_' prefixed variables have been
   removed and all names are in lower-case.
  */
  this.server = {};

  /*
   These are the HTTP request headers sent by the client. All the names are lower case and all '-' is replaced by '_'.
   These are extracted from the environment variables, they are passed in with a prefix 'HTTP_' which is stripped out.
  */
  this.headers = {};

  /*
   This object is a concatenation of all the GET (query) and POST form object information.
   This is helpful to access all form field values without having to check if the method is a POST or GET.
  */
  this.body = {};

  /*
   Initializes the HTTP response variables as passed in by the process throw the environment variables
   and the input stream for the post data.
  */
  this.init = function () {
    // Start by parsing the out the environment variables and HTTP headers.
    CgiParser.enviromentVarialbesAndHeaders(process.env, self.server, self.headers);

    // User the server variables to get the rest of the information about the request.
    self.method = self.server['request-method'];
    self.httpVersion = self.server['server-protocol'];

    // The content type and length is stored in the server and does not contain the 'http_' prefix.
    // Therefore we are going to manually copy them over.
    self.headers['content-type'] = (self.server.hasOwnProperty('content-type') ? self.server['content-type'] : '');
    self.headers['content-length'] = (self.server.hasOwnProperty('content-length') ? self.server['content-length'] : 0);

    // Create the URL object passing it the request URL and then get the get query object from it.
    // self.url = URL.parse(self.server['request-uri'], true);
    self.url = URL.parse(self.server['request-scheme'] + "://" + self.headers.host + self.server['request-uri'], true);

    self.query = self.url.query;

    self.hostname = self.url.hostname;

    self.host = self.url.host;

    self.protocol = self.url.protocol;

    self.path = self.url.path;

    self.pathname = self.url.pathname;

    self.ip = (function (ip) {
      return (ip == "::1") ? '127.0.0.1' : ip;
    })(self.server['remote-addr']);

    // Finally determine if the method is post and if it is multi-part post data.
    self.isMultiPart = (this.headers['content-type'].toLowerCase().indexOf('multipart/form-data') > -1);

    // TODO: we could also parse out the boundary of a multi-part post.
    // TODO: parse the post data if they exist.
  };

  /*
   Reads all the post data from the standard stream.
  */
  this.readPost = function (onFinishedRead, parseData) {
    // Set the optional parameter to the default value.
    if (parseData === undefined) parseData = true;

    // Read any post data before executing the script.
    process.stdin.on('data', function (data) {
      self.rawBody += data;
    });

    // When all the data have been read then invoke the given call back method.
    process.stdin.on('end', function () {
      // If we need to parse the post data before invoking the call back method then do so.
      if (parseData) self.parsePost();

      // If a finished call back is provided then call it.
      if (onFinishedRead) onFinishedRead();
    });
  };

  /*
   Parses the post data and populates the request post object with the data.
  */
  this.parsePost = function () {
    // If the content type is multi-part then use the CGI parser to parse it.
    if (self.isMultiPart) CgiParser.multiPart(self);

    // Otherwise use the standard query string parser to the parse the post data.
    // else self.body = self.url.query;
    else self.body = Queryparser.parse(self.rawBody);

    if (self.isMultiPart || Object.keys(self.url.query).length > 0) {
      Object.assign(self.body, self.url.query);
    }
  };

  // Call the constructor.
  this.init();
}
// CgiHttpRequest.prototype = Object.create(Process.prototype);
/*
The MIT License (MIT)

Copyright (c) 2020 Jeyaprakash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@Author: Jeyaprakash
@Email: anthony.jeyaprakash@gmail.com

 This static object provides methods to facilitate parse data for the CGI process.
*/
let CgiParser = {
  /*
   This method traverse the provided environment variables and splits them into the HTTP headers
   and the server environment variables. All variables names will be converted to lower-case.
   
   server: is an output object that will contain the server variables
   headers: is an output object that will contain the HTTP headers.
  */
  enviromentVarialbesAndHeaders: function (envVariables, server, headers) {
    // Traverse the variables and parse them out into server or HTTP header variables.
    for (let name in envVariables) {
      // Get the value and convert the name into lower case to start.
      let value = envVariables[name];
      name = name.toLowerCase();
      name = name.split("_").join("-");

      // If starts with http then remove 'http_' and add it to the http header array, otherwise add it to the server array.
      if (name.indexOf('http-') === 0) headers[name.substring('http-'.length)] = value;
      else server[name] = value;
    }
  },


  multiPart: function (request) {
    let {
      rawBody: postData
    } = request;
    let dataLength = postData.length;
    let endIndex = 0;
    let startIndex = 0;
    let attachments = [];

    // Read the first line until \n, this will be the boundary.
    endIndex = postData.indexOf("\n");
    let boundary = postData.substring(startIndex, endIndex - 1);
    startIndex = endIndex + 1;
    let postDataChunks = [];
    for (let j = 0; j < dataLength; j++) {
      postDataChunks.push(Buffer.from(postData[j]));
    }

    // Split the multi parts into single parts.
    request.parts = postData.split(boundary);
    request.parts.pop();
    request.parts.shift();


    // Traverse the parts and parse them as if they where a single HTTP header and body.
    let re1 = new RegExp('^Content-Disposition: form-data; name="(.+)"$[\r\n]+(.+)$', 'm');

    for (let index = 0; index < request.parts.length; index++) {
      let part = request.parts[index];
      match = re1.exec(part);
      if (match) {
        let key = match[1],
          value = match[2],
          files = match[3];
        if (key.indexOf('; filename') != -1) {
          files = part.split(value);
          // let match1 = re1.exec(files[0].replace("; "))
          let obj = {};
          // obj['base64'] = new Buffer(files[1].trim()).toString('base64');
          obj['name'] = key.split('"; filename')[0].trim();
          obj['filename'] = key.split('; filename="')[1].trim();
          obj['type'] = value.split(':')[1].trim();
          obj['data'] = files[1].trim();
          obj['base64'] = Buffer.from(files[1].trim()).toString('base64');
          obj['base64url'] = Buffer.from(files[1].trim()).toString('base64url');
          attachments.push(obj);

        } else {
          request.body[key] = value;
        }
      }

    }


    // for(let index = 0; index < request.parts.length; index++){

    // }
    // multiple attachment files included in request.files if exist
    if (attachments.length > 0) {
      request.files = attachments;
      // request.body.attachments = attachments;
    }
    // if (request.parts.length > 0) body = request.parts;

    // // Return the parsed post object.
    // return post;
  },
};


/*
The MIT License (MIT)

Copyright (c) 2020 Jeyaprakash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

@Author: Jeyaprakash
@Email: anthony.jeyaprakash@gmail.com
*/
// Add the required modules.
const URL = require('url');
const Queryparser = require('querystring');
const ejs = require('ejs');
const path = require('path');
const VM = require('vm');
const Prince = require('prince');
const pdftk = require('node-pdftk');
const util = require('util');
const BUFF_MAX_LEN = require('buffer').constants.MAX_LENGTH;
const {
  createWriteStream,
  createReadStream,
  unlink
} = require('fs');
const log = createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a'
});

/*
 The first thing we are going to do is set up a way to catch any global 
 exceptions and send them to the client. This is extremely helpful when developing code.
*/

process.on('uncaughtException', function (error) {
  // Build the HTML error.
  let htmlError = '<br/><div style="color:red"><b>EXCEPTION</b>: ' + error.message + '<i><pre>' + error.stack + '</pre></i></div></br>';

  // If the CGI context has been created then use the response to send the error
  if (cgiNodeContext !== null) cgiNodeContext.response.write(htmlError);

  // Otherwise send an HTTP header followed by the error.
  else process.stdout.write("Content-type: text/html; charset=iso-8859-1\n\n" + htmlError);
});

/*
 When the process exists make sure to save any session data back to the file.
*/
process.on('exit', function (code) {
  // if(code) log.write('error: '+"");
});

if (module.parent != null) {
  module.exports = CgiHttpContext;
} else {

  const {
    execFile,
    spawn,
    exec,
    execSync
  } = require('child_process');

  cgiNodeContext = new CgiHttpContext();
  // process.env.CONTENT_TYPE = "application/x-www-form-urlencoded";
  // log.write("QUERY_STRING=> " + process.env.QUERY_STRING + "\r\n");
  // log.write("CGI_ENV=> " + JSON.stringify(process.env, null, 4) + "\r\n");

  // Create a callback function that will get called when everything is loaded and ready to go. This will execute the script.
  const onReady = function () {
    cgiNodeContext.request.parsePost();
    // cgiNodeContext.include(process.env.PATH_TRANSLATED);
    if (process.env.PATH_TRANSLATED.indexOf(".ejs") != -1) {
      const body = {
        ...cgiNodeContext.request.body,
        ...cgiNodeContext.request.query
      };
      let viewsName = process.env.PATH_TRANSLATED;
      viewsName = viewsName.split(".ejs")[0];
      viewsName = viewsName.split("/");
      viewsName = viewsName[viewsName.length - 1];
      cgiNodeContext.response.render(`${viewsName}`, body);
    } else if (process.env.PATH_TRANSLATED.indexOf('.node') != -1) {
      const body = {
        ...cgiNodeContext.request.body,
        ...cgiNodeContext.request.query
      };
      // CGI_ENV.QUERY_STRING = Queryparser.stringify({
      //     ...cgiNodeContext.request.query,
      //     ...cgiNodeContext.request.body
      // });
      // CGI_ENV.REQUEST_URI += "?" + CGI_ENV.QUERY_STRING;
      // log.write("CGI_ENV=> " + JSON.stringify(CGI_ENV, null, 4));
      // log.write("\nisMultiPart=> " + cgiNodeContext.request.isMultiPart);
      // log.write("\nFiles=> " + JSON.stringify(cgiNodeContext.request.files, null, 4));
      // log.write("\nquerystring=> " + Queryparser.stringify({
      //     ...cgiNodeContext.request.query,
      //     ...cgiNodeContext.request.body
      // }));
      // let cgi_exec = process.env.PATH_TRANSLATED;
      // cgi_exec = cgi_exec.replace("")
      // if (cgiNodeContext.request.files.length > 0) {
      //     cgiNodeContext.request.files.forEach(file=>{
      //         // if(file.filename) require('fs').writeSync(`${path.resolve(__dirname, file.filename)}`, Buffer.from(files.data, 'base64').toString('binary'));
      //         log.write("\r\n" + file.filename);
      //         log.write("\r\n => " + file.base64);
      //         log.write("\r\n => " + file.base64url);
      //     });
      // }
      //log.write("\nenv=>"+JSON.stringify(process.env, null, 4));
      // log.write("\nip=>" + cgiNodeContext.request.ip + ", url=> " + cgiNodeContext.request.url.path);
      // log.write("\nreqBody=> " + cgiNodeContext.request.rawBody);

      let cgiexec = `NODE_OPTIONS="--napi-modules" node -p "require('${path.resolve(process.env.PATH_TRANSLATED)}').getResponse();"`;
      let exclude = [
        '/cgi-bin/ipset.node',
        '/cgi-bin/upload.node',
        '/cgi-bin/fUpload.node',
        '/cgi-bin/fDownload.node',
        '/cgi-bin/crtprifac.node'
      ]
      if (exclude.includes(cgiNodeContext.request.url.pathname)) {
        cgiexec = process.env.PATH_TRANSLATED;
      }
      /*const {
        stdin,
        stdout,
        stderr
      } = await exec(cgiexec);*/
      //process.stdin.pipe(cgiNodeContext.request.rawBody);
      let result = execSync(cgiexec, {
        maxBuffer: BUFF_MAX_LEN,
        input: Buffer.from(cgiNodeContext.request.rawBody)
      });
      // , (error, stdout, stderr) => {
      //   /*if(cgiNodeContext.request.url.pathname.indexOf("ppreprun.node") != -1)
      //   {
      //   //process.stdin.pipe(stdin);
      //   log.write("\nresData=> ");
      //   stdout.pipe(log);
      //   stdout.pipe(process.stdout);
      //   stdin.cork();
      //   //stdin.write(Queryparser.stringify(Queryparser.parse(cgiNodeContext.request.rawBody)));
      //   stdin.write(Buffer(cgiNodeContext.request.rawBody));
      //   stdin.uncork();
      //   }
      //   else 
      //   {*/
      //   let responseData = '';
      //   stdout.on('data', (chunk) => {
      //     responseData += chunk;
      //   });
      //   stdout.on('end', () => {
          let resData = result.toString().split("\r\n\r\n");
          let contentType = resData.shift();
          // log.write("\nresponseData=> " + responseData);
          if (contentType) {
            let headerName = (contentType?.split(":")[0] || "").toLocaleLowerCase().trim();
            let headerValue = (contentType?.split(":")[1] || "").toLocaleLowerCase().trim();
            // log.write("\nresData=> " + resData.length)
            resData = resData[0];

            if (headerName == "content-type") {
              cgiNodeContext.response.set({
                "Content-Type": headerValue
              });
            }
            if (resData != "") {
              // resData = Buffer.from(resData.trim(), 'ascii').toString('ascii');
              if (process.env.PATH_TRANSLATED.indexOf("resetPwd.node") != -1 || (process.env.PATH_TRANSLATED.indexOf("process.node") != -1 && body.rel == 'cusr')) {
                let res = resData.indexOf("\t") != -1 ? resData.split("\t")[1].trim() : JSON.parse(resData).pdfName;
                // res = res.trim();
                if (res == "") {} else {
                  let html_name = "/var/prism/www/report/rep_html/" + res + ".html";
                  let pdf_sample = "/var/prism/www/report/rep_html/" + res + ".pdf";
                  let pdf_file = "/var/prism/www/editor/usrpwdPdf/" + res + ".pdf";

                  Prince()
                    .inputs(html_name)
                    .output(pdf_sample)
                    .execute()
                    .then(() => {
                      // response.write("OK: done");
                      // log.write(pdf_sample + ' Created...\n');
                      pdftk
                        .input(pdf_sample)
                        .cat("2-end")
                        .output(pdf_file)
                        .then(async (buffer) => {
                          // response.write("concatenated successfully.");
                          await unlink(pdf_sample);
                          // await createReadStream(html_name).pipe(createWriteStream(BACKUP_FILE));
                          await unlink(html_name);
                          // log.write(pdf_file + ' Created...\n');
                          // await response.write('Created');
                        }).catch(err => {
                          // response.write("ERROR: "+ util.inspect(err));
                          // log.write("ERROR: " + util.inspect(err));
                        });
                    }).catch(error => {
                      // response.write("ERROR: "+ util.inspect(error));
                      // log.write("ERROR: " + util.inspect(error));
                    });
                }

              }

              // resData = resData.trim();
              // log.write("\nresData=> " + resData);
              // if(headerValue.indexOf('json')!=-1) cgiNodeContext.response.json(JSON.parse(resData));
              // else{
              resData = Buffer.from(resData.trim());
              cgiNodeContext.response.write(resData);
              // cgiNodeContext.response.end();
              // }
            } else {
              cgiNodeContext.response.write("404\t\tUnabletoprocess");
              // cgiNodeContext.response.end();
            }
          }
      //   });
      //   let errData = '';
      //   stderr.on('data', (chunk) => {
      //     errData += chunk;
      //   });
      //   stderr.on('end', () => {
      //     // log.write('\nstderr: ' + errData);
      //   });
      //   // stdin.setDefaultEncoding('utf-8');
      //   //log.write("\nrawBody=>"+Queryparser.stringify(Queryparser.parse(cgiNodeContext.request.rawBody)));
      //   // if(cgiNodeContext.request.url.pathname.indexOf("ppreprun.node") != -1) stdin.write(Queryparser.stringify(Queryparser.parse(cgiNodeContext.request.rawBody)));
      //   // if(cgiNodeContext.request.url.pathname.indexOf("ppreprun.node") != -1) stdin.write(Buffer.from(cgiNodeContext.request.rawBody, 'ascii').toString('ascii'));
      //   // else 
      //   // stdin.write(Buffer.from(cgiNodeContext.request.rawBody, 'binary').toString('binary'));
      //   // stdin.end();
      //   //}
      //   // cgiNodeContext.response.pipe(stdout.pipe);
      //   // cgiNodeContext.response.write(require(process.env.PATH_TRANSLATED).getResponse());

      //   // cgiNodeContext.response.write(cgiNodeContext.require(process.env.PATH_TRANSLATED).getResponse());
      //   // cgiNodeContext.response.end();

      // });
      
    }

  };


  // TODO: remove this when the POST parser is done.
  // cgiNodeContext.request.method = 'GET';

  // If the HTTP method is a 'POST' then read the post data. Otherwise process is ready.
  if (cgiNodeContext.request.method != 'POST') onReady();
  else cgiNodeContext.request.readPost(onReady);

  // cgiNodeContext.request.readPost(onReady);
}