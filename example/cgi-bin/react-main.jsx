#!/usr/bin/babel-node --preset=["@babel/preset-modules", "@babel/preset-react", "@babel/preset-env"]

// #!/usr/bin/node
// #!/usr/bin/node --experimental-modules=true --input-type=module --jsx=true --harmony


// const React = require('react');
// const { Component } = React;
// const { renderToString } = require('react-dom/server');

import React from 'react';
import {renderToString} from 'react-dom/server';

import CgiHttpContext from 'cgi-node';
// import os from 'os';
import { hostname, userInfo } from 'os';

const {Component} = React;
const {request, response} = new CgiHttpContext();
// const { hostname, userInfo } = os;

class Greeting extends Component {
  render() {
    return (<h1 key={this.props.key}>Hello, {this.props.name}</h1>);
  }
}

class HelloMessage extends Component {
  render() {
    // let name = hostname();
    let names = [hostname(), userInfo().username];
    let nameList = names.map((name, index)=>{
      return (<Greeting name={name} key={index} />);
    });
    return (<div>{nameList}</div>);
  }
}

if (request.method == "GET"){
  main();
} else if (request.method == "POST") {
  request.readPost(main);
} else {
  console.log(renderToString(<HelloMessage />));
}

function main () {
  // console.log('Content-type: text/html');
  // console.log('');
  // console.log(renderToString(<HelloMessage />));
  
  response.set('Content-Type', 'text/html');
  response.write(renderToString(<HelloMessage />));
}