function cloneObject(what) {
  for (i in what) {
    this[i] = what[i];
  }
}

function setCharAt(str, index, ch) {                         // how annoying
  return str.substr(0, index) + ch + str.substr(index + 1);
}

function getPlatform() {
  var platform = navigator.platform.toLowerCase();

  if (platform.indexOf('linux') != -1) {
    return 'linux';
  }

  if (platform.indexOf('mac') != -1) {
    return 'mac';
  }

  if (platform.indexOf('win') != -1) {
    return 'windows';
  }

  return 'other';
}

function testAccelKey(event) {
  if (getPlatform() == 'mac') {
    return event.metaKey;
  }

  return event.ctrlKey;
}

function parseArguments(args) {
  args = args.split('?');
  if (args.length < 2) {
    return {};
  }
  args = args[1].split('&');
  
  var parsedArgs = {};
  for (var x = 0; x < args.length; ++x) {
    var split = args[x].split('=');
    parsedArgs[split[0]] = decodeURIComponent(split[1]);
  }

  return parsedArgs;
}

function getArgument(args, field) {
  var parsedArgs = parseArguments(args);
  return parsedArgs[field] || '';
}

function generateArgs(args) {
  if (!args) {
    return '';
  }

  var queryString = '';
  for (var key in args) {
    queryString += (!queryString.length ? '?' : '&') + key + '=' + encodeURIComponent(args[key]);
  }

  return queryString;
}
