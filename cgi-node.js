#!/usr/bin/env node

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
function CgiHttpContext(onFinished)
{
	let self = this;
	// self.stdin = process.stdin;
	// self.stdout = process.stdout;
	// self.stderr = process.stderr;
	self.on = process.on;

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
function CgiHttpResponse() 
{
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
	this.headers = { 'content-type': 'text/html; charset=iso-8859-1' };

	/*
	 Sends the current response.headers to the client if it has not yet been sent.
	 After the header is sent it will not be sent again even if the method is called explicitly. 
	 Headers changed within response.headers after the headers have been sent will not be sent.
	*/
	this.sendHeaders = function()
	{
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
	this.write = function(string)
	{
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
	this.end = function()
	{
		// If the header was not yet sent then send it.
		self.sendHeaders();

		// End the process.
		process.exit();
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

 This object contains all the information about the process and the HTTP request sent by the client.
 The information is all parsed and easily accessible.
*/
function CgiHttpRequest() 
{
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
	this.init = function()
	{
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
	this.parsePost = function()
	{
		// If the content type is multi-part then use the CGI parser to parse it.
		if (self.isMultiPart) CgiParser.multiPart(self);

		// Otherwise use the standard query string parser to the parse the post data.
		// else self.body = self.url.query;
		else self.body = Queryparser.parse(self.rawBody);

		if (self.isMultiPart && Object.keys(self.url.query).length > 0) {
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
let CgiParser =
{
	/*
	 This method traverse the provided environment variables and splits them into the HTTP headers
	 and the server environment variables. All variables names will be converted to lower-case.
	 
	 server: is an output object that will contain the server variables
	 headers: is an output object that will contain the HTTP headers.
	*/
	enviromentVarialbesAndHeaders: function(envVariables, server, headers)
	{
		// Traverse the variables and parse them out into server or HTTP header variables.
		for (let name in envVariables)
		{
			// Get the value and convert the name into lower case to start.
			let value = envVariables[name];
			name = name.toLowerCase();
			name = name.split("_").join("-");

			// If starts with http then remove 'http_' and add it to the http header array, otherwise add it to the server array.
			if (name.indexOf('http-') === 0) headers[ name.substring('http-'.length) ] = value;
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
			postDataChunks.push(new Buffer(postData[j]));
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
let URL = require('url');
let Queryparser = require('querystring');

module.exports = CgiHttpContext;
