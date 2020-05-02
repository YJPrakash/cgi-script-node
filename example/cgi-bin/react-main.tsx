#!/usr/bin/ts-node-script --project=./tsconfig.json

// #!/usr/bin/babel-node --preset=["@babel/preset-react", "@babel/preset-typescript", "@babel/preset-env"] --jsx=true
// #!/usr/bin/node
// #!/usr/bin/node --experimental-modules=true --input-type=module --jsx=true --harmony


// const React = require('react');
// const { Component } = React;
// const { renderToString } = require('react-dom/server');

import * as React from 'react';
import { renderToString } from 'react-dom/server';

// import CgiHttpContext from 'cgi-node';

const { Component } = React;
// const {request, response} = new CgiHttpContext();

class Greeting extends Component {
  props: {
    name: string,
    key: number
  }
  render() {
    return (<h1 key={this.props.key}>Hello, {this.props.name}</h1>);
  }
}

class HelloMessage extends Component {
  render() {
    // let name = 'Prakash';
    let names = ['Prakash', 'Stella'];
    let nameList = names.map((name: string, index: number)=>{
      return (<Greeting name={name} key={index} />);
    });
    return (<div>{nameList}</div>);
  }
}

// if (request.method == "GET"){
//   main();
// } else if (request.method == "POST") {
//   request.readPost(main);
// }

function main () {
  console.log('Content-type: text/html');
  console.log('');
  console.log(renderToString(<HelloMessage />));

  // response.set('Content-Type', 'text/html');
  // response.write(renderToString(<HelloMessage />));
}

main();
