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

function appendLog(message, css, type, trusted) {
  if (!window["gCli"]) {
    return;
  }

  if (!trusted) {
    message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  gCli.addHistory({ html: message, wrap: false });
  gCli.updateHistoryView(true);
}

function stdin(message) {
  gCli.update(message);
}

function error(message, skipLog, trusted, skipAlert) {
  if (!skipLog) {
    appendLog("\n" + message + "\n", 'error', "error", trusted);
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
