#!/usr/bin/env node

var Habitat = require('habitat');
var args = require('minimist')(process.argv.slice(2));
var yaml = require('js-yaml');
var fs   = require('fs');
var clc = require('cli-color');

function logError (message) {
  console.error(clc.red('envme error: ' + message));
}

function help() {
  console.log(fs.readFileSync(__dirname + '/help.txt', 'utf8'));
}

function buildEnv (json) {
  var output = '';
  console.log('Building .env from defaults...');
  for (var key in json) {
    if (!json[key].default) {
      logError('WARNING: ' + key + ' does not have a default value, you may want to add it yourself.');
    }
    output += key + '=' + json[key].default + '\n';
  }
  return output;
}

function init(values) {
  if (fs.readFileSync('./.env') && !args.f && !args.force) {
    logError('Could not create .env, already exists. If you want to overwrite this, use init -f');
    return;
  }
  fs.writeFileSync('./.env', buildEnv(values),'utf8')
  console.log(clc.green('.env created'));
  return;
}


function checkEnv(values) {
  Habitat.load('.env');

  var env = new Habitat();
  var all = env.all();

  console.log('Checking .env...');

  var info;
  var key;
  var missing = 0;

  for (key in values) {
    info = values[key];

    if (info.required && !env.get(key)) {
      console.log(clc.red(key + ': Not found in your environment!'));
      missing++;
    }
    else if (args.v) {
      console.log(clc.green(key + ': ' + env.get(key) + ' (OK)'));
      if (info.warning) {
        console.log(clc.white(Array( key.length + 3 ).join(' ') + info.warning));
      }
    }

  }

  if (all.length) {
    console.log(clc.yellow('The following values were found in your process.env: '));
  }

  for (key in all) {
    if (!process.env[key]) {
      console.log(clc.yellow(key + ': ' + all[key]));
    }
  }

  if (missing) {
    console.log(clc.red('Done. There were ' + missing + ' missing required values.'));
  } else {
    console.log(clc.green('Done. There were no missing values!'));
  }


}


// Get document, or throw exception on error
try {
  var doc = yaml.safeLoad(fs.readFileSync('.habitant.yml', 'utf8'));
} catch (e) {
  logError('.habitant.yml could not be parsed');
  process.exit(1);
}

if (args._.indexOf('init') > -1) {
 init(doc);
}
else if (args.help || args.h) {
  help();
}
else {
  checkEnv(doc);
}


