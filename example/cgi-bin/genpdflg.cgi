#!/usr/bin/env node

const CgiHttpContext = require('cgi-node');
const cgi = new CgiHttpContext();

const {
  request,
  response
} = cgi;

const {
  writeFile,
  unlink,
  stat
} = require('fs').promises;
const {
  createWriteStream,
  createReadStream
} = require('fs');
let util = require("util");
let Prince = require("prince");
let pdftk = require("node-pdftk");

const DOC_ROOT = '/var/prism/www/';
const PDF_ROOT = `${DOC_ROOT}report/doc_view/`;
const DATA_ROOT = "/var/prism/data/";
const CGI_SCRIPT_PATH = `/usr/lib/cgi-bin`;

const logStream = createWriteStream('error.log', {
  flags: 'w'
});
const outStream = createWriteStream('output.log', {
  flags: 'w'
});

function main() {
  // response.write('content-type: text/plain');
  // response.write('');
  response.set({
    'content-type': 'text/plain'
  });
  response.write('');
  try {
    // request.parsePost();
    let {
      usrid,
      rname,
      rcont
    } = request.body;
    let pdf_sample = `${PDF_ROOT}sample.pdf`;
    let BACKUP_FILE = `${DATA_ROOT}PP_BACKUPS/LgReport_BACKUPS/${rname}.html`;
    let rm_file = `${pdf_sample}`;
    let pdf_file = `${PDF_ROOT}${rname}.pdf`;
    rname = `${usrid}_${rname}.html`;
    let html_name = `${DOC_ROOT}${rname}`;
    outStream.write(JSON.stringify({
      pdf_sample,
      BACKUP_FILE,
      rm_file,
      pdf_file,
      html_name,
      rname
    }, null, 2));
    // let cp_file = `${pdf_sample}`;
    // response.write(html_name);
    writeFile(`${html_name}`, rcont).then(() => {
      Prince()
        .inputs(html_name)
        .output(pdf_sample)
        .execute()
        .then(() => {
          // response.write("OK: done");
          pdftk
            .input(pdf_sample)
            .cat("2-end")
            .output(pdf_file)
            .then(async buffer => {
              // response.write("concatenated successfully.");
              await unlink(rm_file);
              await createReadStream(html_name).pipe(createWriteStream(BACKUP_FILE));
              await unlink(html_name);
              await response.write('Created');
            }).catch(err => {
              response.write("ERROR: "+ util.inspect(err));
              logStream.write("ERROR: "+ util.inspect(err));
            });
        }).catch(error => {
          response.write("ERROR: "+ util.inspect(error));
          logStream.write("ERROR: "+ util.inspect(error));
        });
    });
    // process.stderr.pipe(logStream);
  } catch (error) {
    response.write("ERROR: "+ util.inspect(error));
    logStream.write("ERROR: "+ util.inspect(error));
    // process.stderr.pipe(logStream);
  }
}

if (request.method == 'GET') {
  main();
} else if (request.method == 'POST') {
  request.readPost(main);
}