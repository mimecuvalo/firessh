var logging = {
  DEBUG : 10,
  INFO : 20,
  WARNING : 30,
  ERROR : 40,
  CRITICAL : 50,

  log : function(level, msg) {
    if (level == this.DEBUG) {
      debug(msg);
    } else if (level >= this.ERROR) {
      error(msg);
    } else {
      appendLog(msg + "\n");
    }
  }
};
DEBUG = logging.DEBUG;
INFO = logging.INFO;
WARNING = logging.WARNING;
ERROR = logging.ERROR;
CRITICAL = logging.CRITICAL;

function appendLog(message, css, type, opt_frag) {
  if (!window["gCli"]) {
    return;
  }

  var frag;
  if (opt_frag) {
    frag = opt_frag;
  } else {
    frag = gCli.doc.createDocumentFragment();
    var div = gCli.doc.createElement('div');
    div.textContent = message;
    frag.appendChild(div);
  }

  gCli.addHistory({ html: frag, wrap: false });
  gCli.updateHistoryView(true);
}

function stdin(message) {
  gCli.update(message);
}

function error(message, skipLog, trusted, skipAlert) {
  if (!skipLog) {
    appendLog("\n" + message + "\n", 'error', "error");
  }
}

function detailedError(msg, url, linenumber) {
  error('Error message= ' + msg + '\nURL= ' + url + '\nLine Number= ' + linenumber, false, true, !gDebugMode);
}

function debug(ex, level, trusted) {
  if (gDebugMode && window['console'] && window.console.log) {
    console.log("\n" + (level ? level : "Debug") + ": " + (ex.stack ? (ex.message + '\n' + ex.stack) : (ex.message ? ex.message : ex)) + "\n");
  }
}
