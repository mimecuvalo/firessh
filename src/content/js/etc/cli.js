/*
  TermEmulator - Emulator for VT100 terminal programs
  Copyright (C) 2008 Siva Chandran P

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with this library; if not, write to the Free
  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

  Contributor(s):
  Siva Chandran P <siva.chandran.p@gmail.com>    (original author)

  Mime Cuvalo     <mimecuvalo@gmail.com>  (translated into JS, extended and refined)

  Reference: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
  
*/

/*
  Initializes the terminal with specified rows and columns. User can
  resize the terminal any time using Resize method. By default the screen
  is cleared(filled with blank spaces) and cursor positioned in the first
  row and first column.
*/
var cli = function(contentWindow) {
  doc = contentWindow.document;
  this.contentWindow = contentWindow;
  this.doc           = doc;
  this.body          = doc.body;
  this.history       = doc.getElementById('history');
  this.historyOuter  = doc.getElementById('history-outer');
  this.terminal      = doc.getElementById('terminal');
  this.cursor        = doc.getElementById('cursor');
  this.input         = doc.getElementById('input');

  this.captureFontSize();

  $('cmdlog').contentWindow.addEventListener('scroll', this.updateHistoryView.bind(this), false);
  this.input.addEventListener('keydown', this.keyDown.bind(this), false);
  this.input.addEventListener('keypress', this.keyPress.bind(this), false);
  this.input.addEventListener('keyup', this.keyUp.bind(this), false);
  this.body.addEventListener('mousedown', this.mousedown.bind(this), false);
  //this.body.addEventListener('click', this.inputFocus.bind(this), false);
  this.body.addEventListener('mouseup', this.maybeCopy.bind(this), false);
  this.body.addEventListener('keypress', this.bodyKeyPress.bind(this), false);
  this.doc.addEventListener('focus', this.onFocus.bind(this), false);
  this.doc.addEventListener('blur', this.onBlur.bind(this), false);

  this.body.addEventListener('copy', this.copy.bind(this), false);
  this.body.addEventListener('paste', this.paste.bind(this), false);
  this.body.oncontextmenu = function() { return false; }; // addEventListener doesn't work for some reason...

  this.onResize(true);

  this.curX = 0;
  this.curY = 0;
  this.ignoreChars = false;

  // special character handlers
  this.charHandlers = {};
  this.charHandlers[this.__ASCII_NUL]  = this.__OnCharIgnore.bind(this);
  this.charHandlers[this.__ASCII_BEL]  = this.__OnCharBel.bind(this);
  this.charHandlers[this.__ASCII_BS]   = this.__OnCharBS.bind(this);
  this.charHandlers[this.__ASCII_HT]   = this.__OnCharHT.bind(this);
  this.charHandlers[this.__ASCII_LF]   = this.__OnCharLF.bind(this);
  this.charHandlers[this.__ASCII_VT]   = this.__OnCharLF.bind(this);
  this.charHandlers[this.__ASCII_FF]   = this.__OnCharLF.bind(this);
  this.charHandlers[this.__ASCII_CR]   = this.__OnCharCR.bind(this);
  this.charHandlers[this.__ASCII_XON]  = this.__OnCharXON.bind(this);
  this.charHandlers[this.__ASCII_XOFF] = this.__OnCharXOFF.bind(this);
  this.charHandlers[this.__ASCII_ESC]  = this.__OnCharESC.bind(this);
  this.charHandlers[this.__ASCII_CSI]  = this.__OnCharCSI.bind(this);

  // escape sequence handlers
  this.escSeqHandlers = {};
  this.escSeqHandlers[this.__ESCSEQ_ICH] = this.__OnEscSeqICH.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CUU] = this.__OnEscSeqCUU.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CUD] = this.__OnEscSeqCUD.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CUF] = this.__OnEscSeqCUF.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CUB] = this.__OnEscSeqCUB.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CHA] = this.__OnEscSeqCHA.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_CUP] = this.__OnEscSeqCUP.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_ED]  = this.__OnEscSeqED.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_EL]  = this.__OnEscSeqEL.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_IL]  = this.__OnEscSeqIL.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DL]  = this.__OnEscSeqDL.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DCH]  = this.__OnEscSeqDCH.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_SU]  = this.__OnEscSeqSU.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_SD]  = this.__OnEscSeqSD.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_VPA] = this.__OnEscSeqVPA.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DECSET] = this.__OnEscSeqDECSET.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DECRST] = this.__OnEscSeqDECRST.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_SGR] = this.__OnEscSeqSGR.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DECSTBM] = this.__OnEscSeqDECSTBM.bind(this);
  this.escSeqHandlers[this.__ESCSEQ_DECWINMAN] = this.__OnEscSeqDECWINMAN.bind(this);

  this.escParenSeqHandlers = {};
  this.escParenSeqHandlers[this.__ESCPARENSEQ_usg0] = this.__OnEscParenSeqUsg0.bind(this);
  this.escParenSeqHandlers[this.__ESCPARENSEQ_specg0] = this.__OnEscParenSeqSpecg0.bind(this);

  // defines the printable characters, only these characters are printed
  // on the terminal
  this.printableChars = "0123456789";
  this.printableChars += "abcdefghijklmnopqrstuvwxyz";
  this.printableChars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  this.printableChars += "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ ";
  this.printableChars += "\t";

  // terminal screen, its a list of string in which each string always
  // holds self.cols characters. If the screen doesn't contain any
  // characters then it'll be blank spaces
  this.screen = [];

  this.scrRendition = [];

  // current rendition
  this.curRendition = this.resetStyle;

  // list of dirty lines since last call to GetDirtyLines
  this.isLineDirty = [];

  this.blank = { c: '\u00A0', style: this.resetStyle, wrap: false };
  this.blankHTML = { html: doc.createDocumentFragment(), wrap: false };

  for (var i = 0; i < this.rows; ++i) {
    var line = [];

    for (var j = 0; j < this.cols; ++j) {
      line.push(new cloneObject(this.blank));
    }

    this.screen.push(line);
    this.scrRendition.push(new cloneObject(this.blankHTML));
    this.isLineDirty.push(false);
  }

  this.onTerminalReset(true);

  // unparsed part of last input
  this.unparsedInput = null;

  this.input.value = '';
  this.input.focus();

  //window.setInterval(this.cursorUpdate.bind(this), 500);
};

cli.prototype = {
  __ASCII_NUL   : 0,    // Null
  __ASCII_BEL   : 7,    // Bell
  __ASCII_BS    : 8,    // Backspace
  __ASCII_HT    : 9,    // Horizontal Tab
  __ASCII_LF    : 10,   // Line Feed
  __ASCII_VT    : 11,   // Vertical Tab
  __ASCII_FF    : 12,   // Form Feed
  __ASCII_CR    : 13,   // Carriage Return
  __ASCII_XON   : 17,   // Resume Transmission
  __ASCII_XOFF  : 19,   // Stop Transmission or Ignore Characters
  __ASCII_ESC   : 27,   // Escape
  __ASCII_SPACE : 32,   // Space
  __ASCII_CSI   : 153,  // Control Sequence Introducer

  __ESCSEQ_ICH  : '@',  // n @: Insert blanks n(default 1) times.
  __ESCSEQ_CUU  : 'A',  // n A: Moves the cursor up n(default 1) times.
  __ESCSEQ_CUD  : 'B',  // n B: Moves the cursor down n(default 1) times.
  __ESCSEQ_CUF  : 'C',  // n C: Moves the cursor forward n(default 1) times.
  __ESCSEQ_CUB  : 'D',  // n D: Moves the cursor backward n(default 1) times.

  __ESCSEQ_CHA  : 'G',  // n G: Cursor horizontal absolute position. 'n' denotes
                        // the column no(1 based index). Should retain the line
                        // position.

  __ESCSEQ_CUP  : 'H',  // n ; m H: Moves the cursor to row n, column m.
                        // The values are 1-based, and default to 1 (top left
                        // corner).

  __ESCSEQ_ED   : 'J',  // n J: Clears part of the screen. If n is zero
                        // (or missing), clear from cursor to end of screen.
                        // If n is one, clear from cursor to beginning of the
                        // screen. If n is two, clear entire screen.

  __ESCSEQ_EL   : 'K',  // n K: Erases part of the line. If n is zero
                        // (or missing), clear from cursor to the end of the
                        // line. If n is one, clear from cursor to beginning of
                        // the line. If n is two, clear entire line. Cursor
                        // position does not change.

  __ESCSEQ_IL   : 'L',  // n L: Insert n lines. default 1

  __ESCSEQ_DL   : 'M',  // n M: Delete n lines. default 1

  __ESCSEQ_DCH  : 'P',  // n P: Delete n characters. default 1

  __ESCSEQ_SU  : 'S',  // n S: Scroll up P s lines (default = 1) (SU).

  __ESCSEQ_SD  : 'T',  // n T: Scroll down P s lines (default = 1) (SD).

  __ESCSEQ_VPA  : 'd',  // n d: Cursor vertical absolute position. 'n' denotes
                        // the line no(1 based index). Should retain the column
                        // position.

  __ESCSEQ_DECSET  : 'h',  // ? n [;a;b;c...] h: DEC Private Mode Set
                           // n [;a;b;c...] h: Set Mode

  __ESCSEQ_DECRST  : 'l',  // ? n [;a;b;c...] l: DEC Private Mode Reset
                           // n [;a;b;c...] l: Reset Mode

  __ESCSEQ_SGR  : 'm',  // n [;k] m: Sets SGR (Select Graphic Rendition)
                        // parameters. After CSI can be zero or more parameters
                        // separated with ;. With no parameters, CSI m is treated
                        // as CSI 0 m (reset / normal), which is typical of most
                        // of the ANSI codes.

  __ESCSEQ_DECSTBM  : 'r',  // n [;k] r: Sets Scrolling region

  __ESCSEQ_DECWINMAN  : 't',  // n;n;n t: Window manipulation

  __ESCPARENSEQ_usg0  : 'B',  // Set United States G0 character set

  __ESCPARENSEQ_specg0  : '0',  // Set G0 special chars. & line set

  specialKeyMap : {
    9 :  '\x09',   // tab
    27:  '\x1b',   // escape
    35:  '\x05',   // end
    36:  '\x01',   // home
    37:  '\x1bOD', // left
    38:  '\x1bOA', // up
    39:  '\x1bOC', // right
    40:  '\x1bOB', // down
    46:  '\x1b[3~', // delete
    112: '\x1bOP', // F1
    113: '\x1bOQ', // F2
    114: '\x1bOR', // F3
    115: '\x1bOS', // F4
    116: '\x1b[15~', // F5
    117: '\x1b[17~', // F6
    118: '\x1b[18~', // F7
    119: '\x1b[19~', // F8
    120: '\x1b[20~', // F9
    121: '\x1b[21~', // F10
    122: '\x1b[23~', // F11
    123: '\x1b[24~', // F12
  },

  doc : null,
  body : null,
  history : null,
  historyOuter : null,
  terminal : null,
  cursor : null,

  letterHeight : 14,
  letterWidth : 7.2,
  defaultColor : '#33ff33',
  defaultBGColor : 'black',
  font : "Andale Mono",
  fontSize : "12",

  selectionStart : null,
  selectionStartLine : null,
  selectionStartOffset : null,
  scrollingRegion : null,
  insertMode : false,

  graphicsCharactersMode : false,
  graphicsCharacters : {
    '_' : ' ',
    '`' : '♦',
    'a' : '░',
    'b' : '\t',
    'c' : '\x0c',
    'd' : '\x0d',
    'e' : '\x0a',
    'f' : '°',
    'g' : '±',
    'h' : '\x0a',
    'i' : '\x0b',
    'j' : '┘',
    'k' : '┐',
    'l' : '┌',
    'm' : '└',
    'n' : '┼',
    'o' : '⎺',
    'p' : '⎻',
    'q' : '─',
    'r' : '⎼',
    's' : '⎽',
    't' : '├',
    'u' : '┤',
    'v' : '┴',
    'w' : '┬',
    'x' : '│',
    'y' : '≤',
    'z' : '≥',
    '{' : 'π',
    '|' : '≠',
    '}' : '£',
    '~' : '∙',
  },

  origScreen : null,
  origScrRendition : null,

  isFocused : false,
  initialScroll : false,
  historyCache : [],
  newHistoryLines : 0,
  historyStart : -1,
  refresh : false,

  negativeColors : false,

  resetStyle : {
    noStyle : true,
    backgroundColor : '',
    color : '',
    display : '',
    fontStyle : '',
    fontWeight : '',
    letterSpacing: '',
    opacity : '',
    textDecoration : '',
    visibility : '',
    width : '',
  },

  nonAsciiStyle : {
    noStyle : false,
    display : 'inline-block',
    width : '',
    lineHeight: ''
  },

  nonAsciiWideStyle : {
    noStyle : false,
    display : 'inline-block',
    width : '',
    lineHeight: ''
  },

  hideStyle : {
    noStyle : false,
    display : 'none'
  },

  styleNames : {
    backgroundColor : 'background-color',
    color : 'color',
    display : 'display',
    fontStyle : 'font-style',
    fontWeight : 'font-weight',
    letterSpacing : 'letter-spacing',
    lineHeight: 'line-height',
    opacity : 'opacity',
    textDecoration : 'text-decoration',
    visibility : 'visibility',
    width : 'width'
  },

  captureFontSize : function() {
    var borderOffset     = this.cursor.style.border ? 2 : 0;
    this.letterHeight    = this.cursor.getBoundingClientRect().height - borderOffset;
    this.letterWidth     = this.cursor.getBoundingClientRect().width - borderOffset;
    this.nonAsciiStyle.width = this.letterWidth + 'px';
    this.nonAsciiStyle.lineHeight = this.letterHeight + 'px';
    this.nonAsciiWideStyle.width = (this.letterWidth * 2) + 'px';
    this.nonAsciiWideStyle.lineHeight = this.letterHeight + 'px';

    var styleElement = this.doc.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.textContent = "#history div, #terminal div { height: " + this.letterHeight + "px; }";
    this.doc.getElementsByTagName('head')[0].appendChild(styleElement);
  },

  keyDown : function(event) {
  //  event.preventDefault();
  },

  keyPress : function(event) {
    //console.log(event.which + ' '+event.keyCode);
    if (event.keyCode == 33) { // page up
      gCli.body.scrollTop -= gCli.body.clientHeight;
      return;
    } else if (event.keyCode == 34) { // page down
      gCli.body.scrollTop += gCli.body.clientHeight;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.input.value = '';

    var currentSelection = this.contentWindow.getSelection();
    var cutCopyEvent = event.which in { 88: 1, 67: 1, 120: 1, 99: 1 };
    var pasteEvent = event.which == 118;

    if (testAccelKey(event) && (event.shiftKey || getPlatform() == 'mac' ||
        (currentSelection.rangeCount && !currentSelection.isCollapsed && cutCopyEvent) || pasteEvent)) {
      if (event.which == 65 || event.which == 97) {     // cmd-a : select all
        var range = this.doc.createRange();
        range.selectNode(this.body);
        this.contentWindow.getSelection().addRange(range);
        return;
      }

      if (cutCopyEvent) {  // cmd-x, cmd-c [cut, copy]
        this.copy();
        return;
      }

      if (pasteEvent) {  // cmd-v, paste
        this.paste();
        return;
      }

      if (event.which == 84 || event.which == 116) {  // cmd-t, new tab
        runInFirefox("about:blank");
        return;
      }

      if (event.which == 87 || event.which == 119) {  // cmd-w, close tab
        window.close();
        return;
      }
    }

    var self = this;
    var fn = function() { self.input.focus(); };
    setTimeout(fn, 0);
    this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom

    if (event.ctrlKey) {
      if (event.which == 64) {   // ctrl-@
        gConnection.output('\0');
      } else if (event.shiftKey && event.which == 86) { // ctrl-shift-V, we remap this to ctrl-v (lowercase)
        gConnection.output(String.fromCharCode(118 - 96));
      } else if (event.which >= 97 && event.which <= 122) { // ctrl-[a-z]
        gConnection.output(String.fromCharCode(event.which - 96));
      } else if (event.which == 27) { // ctrl-?
        gConnection.output('\x7f');
      } else {
        gConnection.output(String.fromCharCode(event.which));
      }
      return;
    }

    var character;
    if (event.which) {
      character = unescape(encodeURIComponent(String.fromCharCode(event.which)));
    } else {
      character = this.specialKeyMap[event.keyCode];
      if (!character) {
        return;
      }
    }
    gConnection.output(character);
  },

  // this is for CJK characters, the keyPress event isn't fired so we listen for the keyup instead
  keyUp : function(event) {
    event.preventDefault();

    if (this.input.value) {
      this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
      gConnection.output(unescape(encodeURIComponent(this.input.value)));
      this.input.value = '';
    }
  },

  bodyKeyPress : function(event) {
    event.preventDefault();

    var currentSelection = this.contentWindow.getSelection();
    var cutCopyEvent = event.which in { 88: 1, 67: 1, 120: 1, 99: 1 };

    if (testAccelKey(event) && (event.shiftKey || getPlatform() == 'mac' ||
        (currentSelection.rangeCount && !currentSelection.isCollapsed && cutCopyEvent))) {
      if (event.which == 65 || event.which == 97) {      // cmd-a : select all
        return;
      }

      if (cutCopyEvent) {  // cmd-x, cmd-c [cut, copy]
        this.copy();
        return;
      }

      if (event.which == 86 || event.which == 118) {  // cmd-v, paste
        this.paste();
        return;
      }
    } else {
      this.keyPress(event);
    }
  },

  inputFocus : function(event) {
    if (this.contentWindow.getSelection().toString()) { // if highlighting and trying to copy/paste
      return;
    }

    var self = this;
    var fn = function() { self.input.focus(); };
    setTimeout(fn, 0);
    this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
  },

  mousedown : function(event) {
    var self = this;
    setTimeout(function() {
      self.selectionStart = self.contentWindow.getSelection();
      var startSelectionNode = self.selectionStart.anchorNode;
      var startSection = self.hasAncestor(startSelectionNode, self.terminal) ? 'terminal' : 'history';

      if (startSection == 'history') {
        self.selectionStartLine = self.getSelectionLine(startSelectionNode, self.history);
      } else {
        self.selectionStartLine = self.getSelectionLine(startSelectionNode, self.terminal);
      }
      self.selectionStartOffset = self.getTrueOffset(startSelectionNode, self.selectionStart.anchorOffset);
    }, 0);

    // context menu
    if (event.button == 2) {
      var ul = this.doc.createElement('UL');
      ul.className = 'context-menu';
      ul.style.top = event.pageY + 'px';
      ul.style.left = event.pageX + 'px';

      var closeMenu = function() {
        self.body.removeChild(ul);
        self.body.removeEventListener('mousedown', bodyMouseDown);
        self.body.removeEventListener('keydown', bodyKeyDown);
      };

      var bodyKeyDown = function(event) {
        var selectedItem = ul.querySelector('li.active');
        switch (event.which) {
          case 38: // up
            event.preventDefault();
            var prevItem = selectedItem && selectedItem.previousSibling ?
                selectedItem.previousSibling : ul.lastChild;
            if (selectedItem) {
              selectedItem.className = '';
            }
            prevItem.className = 'active';
            break;
          case 40: // down
            event.preventDefault();
            var nextItem = selectedItem && selectedItem.nextSibling ?
                selectedItem.nextSibling : ul.firstChild;
            if (selectedItem) {
              selectedItem.className = '';
            }
            nextItem.className = 'active';
            break;
          case 13:  // enter
            event.preventDefault();
            if (selectedItem) {
              selectedItem.onclick();
            }
            break;
          default:
            break;
        }
      };

      var bodyMouseDown = function(event) {
        var el = event.target;
        while (el) {
          if (el == ul) {
            return;
          }
          el = el.parentNode;
        }

        closeMenu();
      };

      var li = this.doc.createElement('LI');
      li.textContent = gStrbundle.getString("copy");
      li.onclick = function(event) {
        if (event) {
          event.preventDefault();
        }
        self.copy();
        closeMenu();
      };
      ul.appendChild(li);

      li = this.doc.createElement('LI');
      li.textContent = gStrbundle.getString("paste");
      li.onclick = function(event) {
        event.preventDefault();
        self.paste();
        closeMenu();
      };
      ul.appendChild(li);

      this.body.appendChild(ul);
      this.body.addEventListener('mousedown', bodyMouseDown, false);
      this.body.addEventListener('keydown', bodyKeyDown, false);
    }
  },

  getSelectionLine : function(node, ancestor) {
    var startSelectionStartLine = node;
    while (startSelectionStartLine) {
      if (startSelectionStartLine.nodeName == 'DIV') {
        break;
      }

      startSelectionStartLine = startSelectionStartLine.parentNode;
    }

    var index = 0;
    for (var x = 0; x < ancestor.childNodes.length; ++x) {
      if (ancestor.childNodes[x] == startSelectionStartLine) {
        index = x;
        break;
      }
    }

    return (ancestor == this.history ? this.historyStart : 0) + index;
  },

  hasAncestor : function(el, ancestor) {
    el = el.parentNode;
    while (el) {
      if (el == ancestor) {
        return true;
      }

      el = el.parentNode;
    }

    return false;
  },

  getTrueOffset : function(el, offset) {
    if (el.parentNode.nodeName == 'SPAN' || el.parentNode.nodeName == 'DIV') {
      if (el.parentNode.nodeName == 'SPAN') {
        el = el.parentNode.previousSibling;
      } else {
        el = el.previousSibling;
      }

      while (el) {
        offset += el.textContent.length;
        el = el.previousSibling;
      }
    }

    return offset;
  },

  maybeCopy : function(event) {
    var currentSelection = this.contentWindow.getSelection();
    if (!currentSelection.rangeCount || currentSelection.isCollapsed ||
        event.button != 0) {
      return;
    }

    this.copy();

    var existingPopup = document.querySelector('#selection-copied');
    if (existingPopup) {
      existingPopup.parentNode.removeChild(existingPopup);
    }

    var self = this;
    window.setTimeout(function() {
      var msgPopup = document.createElement('div');
      msgPopup.id = 'selection-copied';
      msgPopup.textContent = gStrbundle.getString("copied");
      self.body.appendChild(msgPopup);
      window.setTimeout(function() {
        msgPopup.parentNode.removeChild(msgPopup);
      }, 750);
    }, 250);
  },

  copy : function(event) {
    if (event) {
      event.preventDefault();
    }

    var copytext = "";

    var currentSelection = this.contentWindow.getSelection();
    if (!currentSelection.rangeCount || currentSelection.isCollapsed) {
      return;
    }
    var startSelectionNode = this.selectionStart ? this.selectionStart.anchorNode : null;
    var startSelectionOffset = this.selectionStartOffset;
    var endSelectionNode = currentSelection.focusNode;
    var endSelectionOffset = this.getTrueOffset(endSelectionNode, currentSelection.focusOffset);

    var startSection = startSelectionNode ? (this.hasAncestor(startSelectionNode, this.terminal) ? 'terminal' : 'history') : null;
    var endSection = this.hasAncestor(endSelectionNode, this.terminal) ? 'terminal' : 'history';

    var selectAll = false;

    if (endSelectionNode.nodeName == 'HTML' || (startSelectionNode.nodeName == 'BODY' && endSelectionNode.nodeName == 'BODY')) { // select all
      selectAll = true;
      startSection = 'history';
      endSection = 'terminal';
      startSelectionOffset = 0;
      endSelectionOffset = this.cols;
      this.selectionStartLine = 0;
    }

    var startHistoryLine = null;
    var endHistoryLine = null;
    var startTerminalLine = null;
    var endTerminalLine = null;

    if (startSection == 'history') {
      startHistoryLine = this.selectionStartLine;
      if (endSection == 'terminal') {
        endHistoryLine = this.historyCache.length - 1;
        startTerminalLine = 0;
        endTerminalLine = selectAll ? this.rows - 1 : this.getSelectionLine(endSelectionNode, this.terminal);
      } else {
        endHistoryLine = this.getSelectionLine(endSelectionNode, this.history);
      }
    } else {
      if (endSection == 'terminal') {
        startTerminalLine = this.selectionStartLine;
        endTerminalLine = selectAll ? this.rows - 1 : this.getSelectionLine(endSelectionNode, this.terminal);
      } else {
        startTerminalLine = 0;
        endTerminalLine = this.selectionStartLine;
        var tmp = startSelectionOffset;
        startSelectionOffset = endSelectionOffset;
        endSelectionOffset = tmp;
        startHistoryLine = this.getSelectionLine(endSelectionNode, this.history);
        endHistoryLine = this.historyCache.length - 1;
      }
    }

    var shouldSwitchHistory = startSection == 'history' && endSection == 'history' && startHistoryLine > endHistoryLine;
    var shouldSwitchTerminal = startSection == 'terminal' && endSection == 'terminal' && startTerminalLine > endTerminalLine;

    if (shouldSwitchHistory) {
      var tmp = startHistoryLine;
      startHistoryLine = endHistoryLine;
      endHistoryLine = tmp;
    }

    if (shouldSwitchTerminal) {
      var tmp = startTerminalLine;
      startTerminalLine = endTerminalLine;
      endTerminalLine = tmp;
    }

    if (shouldSwitchHistory || shouldSwitchTerminal) {
      var tmp = startSelectionOffset;
      startSelectionOffset = endSelectionOffset;
      endSelectionOffset = tmp;
    }

    if (startSection == 'terminal' && endSection == 'history') {
      startSection = 'history';
      endSection = 'terminal';
    }

    var sections = [
      { name: 'history', start: startHistoryLine, end: endHistoryLine, rendition: this.historyCache },
      { name: 'terminal', start: startTerminalLine, end: endTerminalLine, rendition: this.scrRendition }
    ];
    var dummyElement = this.doc.createElement('DIV');

    var skippedSection = false;
    for (var s = 0; s < sections.length; ++s) {
      var section = sections[s];
      var skipSection = section.name != startSection && section.name != endSection;
      if (skipSection) {
        skippedSection = true;
        continue;
      } else if (s == 1 && !skippedSection) {
        copytext += "\n";
      }

      for (var x = section.start; x <= section.end; ++x) {
        this.replace(dummyElement, section.rendition[x].html.cloneNode(true));
        if (x == section.start) {
          if (x == section.end && section.name == startSection && section.name == endSection) {
            copytext += dummyElement.textContent.substring(startSelectionOffset, endSelectionOffset);
          } else {
            copytext += dummyElement.textContent.substring(section.name == startSection ? startSelectionOffset : 0);
          }
        } else if (x == section.end && section.name == startSection && section.name == endSection) {
          if (x != section.start && !section.rendition[Math.max(0, x - 1)].wrap) {
            copytext += "\n";
          }
          copytext += dummyElement.textContent.substring(0, section.name == endSection ? endSelectionOffset : null);
        } else {
          if (!section.rendition[Math.max(0, x - 1)].wrap) {
            copytext += "\n";
          }
          copytext += dummyElement.textContent;
        }
      }
    }

    copytext = copytext.replace(/\xA0/g, ' '); // replace \u00A0 with a regular space
    copytext = copytext.replace(/\s+$/mg, ''); // remove trailing whitespace

    var str = Components.classes["@mozilla.org/supports-string;1"].
    createInstance(Components.interfaces.nsISupportsString);
    if (!str) return false;

    str.data = copytext;

    var trans = Components.classes["@mozilla.org/widget/transferable;1"].
    createInstance(Components.interfaces.nsITransferable);
    if (!trans) return false;

    trans.addDataFlavor("text/unicode");
    trans.setTransferData("text/unicode", str, copytext.length * 2);

    var clipid = Components.interfaces.nsIClipboard;
    var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
    if (!clip) return false;

    clip.setData(trans, null, clipid.kGlobalClipboard);

    currentSelection.collapseToEnd();
  },

  paste : function(event) {
    if (event) {
      event.preventDefault();
    }

    var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
    if (!clip) return false;

    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
    if (!trans) return false;
    trans.addDataFlavor("text/unicode");

    clip.getData(trans, clip.kGlobalClipboard);

    var str       = new Object();
    var strLength = new Object();

    trans.getTransferData("text/unicode", str, strLength);
    if (str) {
      str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
      pastetext = str.data.substring(0, strLength.value / 2);
      this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
      gConnection.output(unescape(encodeURIComponent(pastetext)));
    }
  },

  cursorUpdate : function() {
    if (!this.cursor || !this.isFocused || !this.initialScroll) {
      return;
    }

    //this.cursor.style.backgroundColor = this.cursor.style.backgroundColor == '' ? this.defaultColor : '';
  },

  update : function(message) {
    //console.log(message.toSource());
    var scrollLog = this.body.scrollTop + 50 >= this.body.scrollHeight - this.body.clientHeight;

    try {
      this.ProcessInput(message);
      this.updateScreen(scrollLog);
    } catch (ex) {
      debug('cursor: ' + this.curY + ' ' + this.curX);
      debug(ex);
    }
  },

  updateScreen : function(scrollLog, dontScrollIfNotInitialized) {
    this.updateHistoryView();

    for (var i = 0; i < this.rows; ++i) {
      if (this.isLineDirty[i] || this.refresh) {
        this.isLineDirty[i] = false;
        this.scrRendition[i] = this.createScreenRendition(i);
        this.replace(this.terminal.childNodes[i], this.scrRendition[i].html.cloneNode(true));
      }
    }
    this.refresh = false;

    if (!dontScrollIfNotInitialized || this.initialScroll) {
      if (scrollLog || !this.initialScroll) {
        this.initialScroll = true;
        this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
      }
    }

    this.updateCursor();
  },

  updateCursor : function() {
    // update cursor position
    var x = this.curX < this.cols ? this.curX : this.cols - 1;
    this.cursor.style.top = (this.curY * this.letterHeight + this.terminal.offsetTop) + 'px';
    this.cursor.style.left = (x * this.letterWidth + this.terminal.offsetLeft) + 'px';

    this.input.style.backgroundColor = this.cursor.style.color;
    this.input.style.top = this.cursor.style.top;
    this.input.style.left = (x * this.letterWidth + this.terminal.offsetLeft - 2) + 'px';
  },

  transformStyle : function(style) {
    var css = "";
    for (var s in style) {
      if (s != 'noStyle' && style[s]) {
        css += this.styleNames[s] + ":" + style[s] + ";";
      }
    }
    return css;
  },

  createScreenRendition : function(row, screen) {
    var rendition = doc.createDocumentFragment();
    screen = screen || this.screen;

    var styling = false;
    var currentStyle = null;
    var currentSpan = null;
    var currentSpanText = '';
    var currentNonSpanText = '';
    for (var x = 0; x < this.cols; ++x) {
      if (screen[row][x].style.noStyle) {
        if (styling) {
          if (currentSpanText) {
            currentSpan.lastChild.appendData(currentSpanText);
          }
          currentSpan = null;
          currentSpanText = '';
          styling = false;
        }
        if (!currentNonSpanText) {
          rendition.appendChild(doc.createTextNode(''));
        }
        currentNonSpanText += screen[row][x].c;
      } else {
        if ((styling && (currentStyle != screen[row][x].style || screen[row][x].style.width)) || !styling) {
          if (currentSpanText) {
            currentSpan.lastChild.appendData(currentSpanText);
            currentSpanText = '';
          }
          if (currentNonSpanText) {
            rendition.lastChild.appendData(currentNonSpanText);
            currentNonSpanText = '';
          }
          currentSpan = doc.createElement('span');
          currentSpan.setAttribute('style', this.transformStyle(screen[row][x].style));
          currentSpan.appendChild(doc.createTextNode(''));
          rendition.appendChild(currentSpan);
          currentStyle = screen[row][x].style;
        }
        styling = true;
        currentSpanText += screen[row][x].c;
      }
    }

    if (currentSpanText) {
      currentSpan.lastChild.appendData(currentSpanText);
    }

    if (currentNonSpanText) {
      rendition.lastChild.appendData(currentNonSpanText);
    }

    return { html: rendition, wrap: screen[row][0].wrap };
  },

  onTerminalReset : function(init) {
    var div = doc.createElement('div');
    div.textContent = new Array(this.cols + 1).join('\u00A0');
    var historyFrag = doc.createDocumentFragment();
    var terminalFrag = doc.createDocumentFragment();
    for (var x = 0; x < this.rows + 1; ++x) {
      historyFrag.appendChild(div.cloneNode(true));
    }
    for (var x = 0; x < this.rows; ++x) {
      terminalFrag.appendChild(div.cloneNode(true));
    }

    this.replace(this.history, historyFrag);
    this.replace(this.terminal, terminalFrag);

    if (!init) {
      this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
    }

    if (!this.initialScroll) {
      this.body.scrollTop = 0;
    }
  },

  replace: function(el, newContent) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    el.appendChild(newContent);
  },

  addHistory : function(message) {
    if (!message) {
      return;
    }
    var clone = new cloneObject(message);
    clone.html = clone.html.cloneNode(true);
    this.historyCache.push(clone);
    ++this.newHistoryLines;
  },

  updateHistoryView : function(force) {
    var scrollLog = this.body.scrollTop + 50 >= this.body.scrollHeight - this.body.clientHeight;

    this.historyOuter.style.height = (this.historyOuter.clientHeight + this.newHistoryLines * this.letterHeight) + 'px';
    this.newHistoryLines = 0;

    var positionTop = this.body.scrollTop - this.historyOuter.offsetTop;
    var maxBottom = this.historyOuter.clientHeight + this.historyOuter.offsetTop;
    var firstLine;
    if (positionTop < 0) {
      firstLine = 0;
    } else {
      firstLine = (positionTop + this.history.clientHeight < maxBottom
                    ? positionTop
                    : this.historyOuter.clientHeight + this.historyOuter.offsetTop - this.history.clientHeight);
    }
    firstLine = parseInt(firstLine / this.letterHeight);
    this.history.style.top = (firstLine * this.letterHeight) + 'px';

    if (firstLine != this.historyStart || force) {
      for (var i = 0; i < this.rows + 1 && i + firstLine < this.historyCache.length; ++i) {
        if (this.historyCache[i + firstLine]) {
          this.replace(this.history.childNodes[i], this.historyCache[i + firstLine].html.cloneNode(true));
        }
      }
    }
    this.historyStart = firstLine;

    if (typeof force == "boolean" && force) {
      if (scrollLog && this.initialScroll) {
        this.initialScroll = true;
        this.body.scrollTop = this.body.scrollHeight - this.body.clientHeight;  // scroll to bottom
      }
      this.updateCursor();
    }
  },

  /*
    Returns the screen as a list of strings. The list will have rows no. of
    strings and each string will have columns no. of characters. Blank space
    used represents no character.
  */
  GetRawScreen : function() {
    return this.screen;
  },

  /*
    Returns the screen as a list of array of long. The list will have rows
    no. of array and each array will have columns no. of longs. The first
    8 bits of long represents rendition style like bold, italics and etc.
    The next 4 bits represents foreground color and next 4 bits for
    background color.
  */
  GetRawScreenRendition : function() {
    return this.scrRendition;
  },

  /*
    Returns no. rows in the terminal
  */
  GetRows : function() {
    return this.rows;
  },

  /*
    Returns no. cols in the terminal
  */
  GetCols : function() {
    return this.cols;
  },

  /*
    Returns terminal rows and cols as tuple
  */
  GetSize : function() {
    return [this.rows, this.cols];
  },

  /*
    Resizes the terminal to specified rows and cols.
    - If the new no. rows is less than existing no. rows then existing rows
      are deleted at top.
    - If the new no. rows is greater than existing no. rows then
      blank rows are added at bottom.
    - If the new no. cols is less than existing no. cols then existing cols
      are deleted at right.
    - If the new no. cols is greater than existing no. cols then new cols
      are added at right.
  */
  Resize : function(rows, cols) {
    if (rows < this.rows) {
      // remove rows at top
      for (var i = 0; i < this.rows - rows; ++i) {
        this.isLineDirty.shift();
        var rendition = this.scrRendition.shift();
        if (this.origScreen) {
          rendition = this.origScrRendition.shift();
        }

        if (!rendition) {
          var screen = this.origScreen ? this.origScreen : this.screen;
          rendition = this.createScreenRendition(0, screen);
        }
        this.addHistory(rendition);

        this.screen.shift();
        if (this.origScreen) {
          this.origScreen.shift();
        }
      }
    } else if (rows > this.rows) {
      // add blank rows at bottom
      for (var i = 0; i < rows - this.rows; ++i) {
        var line = [];

        for (var j = 0; j < this.cols; ++j) {
          line.push(new cloneObject(this.blank));
        }

        this.screen.push(line);
        this.scrRendition.push(new cloneObject(this.blankHTML));
        this.isLineDirty.push(false);

        if (this.origScreen) {
          var line = [];

          for (var j = 0; j < this.cols; ++j) {
            line.push(new cloneObject(this.blank));
          }

          this.origScreen.push(line);
          this.origScrRendition.push(new cloneObject(this.blankHTML));
        }
      }
    }

    if (this.curY >= rows) {
      this.curY = rows - 1;
    }

    if (cols < this.cols) {
      // remove cols at right
      for (var i = 0; i < rows; ++i) {
        this.screen[i] = this.screen[i].slice(0, cols - this.cols);
        if (this.origScreen) {
          this.origScreen[i] = this.origScreen[i].slice(0, cols - this.cols);
        }
      }
    } else if (cols > this.cols) {
      // add cols at right
      for (var i = 0; i < rows; ++i) {
        for (var j = 0; j < cols - this.cols; ++j) {
          this.screen[i].push(new cloneObject(this.blank));
          if (this.origScreen) {
            this.origScreen[i].push(new cloneObject(this.blank));
          }
        }
      }
    }

    if (this.curX >= cols) {
      this.curX = cols - 1;
    }

    this.rows = rows;
    this.cols = cols;
    this.refresh = true;

    this.onTerminalReset();
    this.updateScreen(true, true);
  },

  /*
    Returns cursor position as tuple
  */
  GetCursorPos : function() {
    return [this.curY, this.curX];
  },

  /*
    Clears the entire terminal screen
  */
  Clear : function() {
    this.ClearRect(0, 0, this.rows - 1, this.cols - 1);
  },

  /*
    Clears the terminal screen starting from startRow and startCol to
    endRow and EndCol.
  */
  ClearRect : function(startRow, startCol, endRow, endCol) {
    if (startRow < 0) {
      startRow = 0;
    } else if (startRow >= this.rows) {
      startRow = this.rows - 1;
    }

    if (startCol < 0) {
      startCol = 0;
    } else if (startCol >= this.cols) {
      startCol = this.cols - 1;
    }

    if (endRow < 0) {
      endRow = 0;
    } else if (endRow >= this.rows) {
      endRow = this.rows - 1;
    }

    if (endCol < 0) {
      endCol = 0;
    } else if (endCol >= this.cols) {
      endCol = this.cols - 1;
    }

    if (startRow > endRow) {
      var temp = startRow;
      startRow = endRow;
      endRow = temp;
    }

    if (startCol > endCol) {
      var temp = startCol;
      startCol = endCol;
      endCol = startCol;
    }

    for (var i = startRow; i < endRow + 1; ++i) {
      var start = 0;
      var end = this.cols - 1;

      if (i == startRow) {
        start = startCol;
      } else if (i == endRow) {
        end = endCol;
      }

      for (var j = start; j < end + 1; ++j) {
        this.screen[i][j].c = '\u00A0';
        this.screen[i][j].wrap = false;
        this.screen[i][j].style = this.curRendition.noStyle ? this.resetStyle : this.curRendition;
      }

      if (end + 1 > start) {
        this.isLineDirty[i] = true;
      }
    }
  },

  /*
    Returns the character at the location specified by row and col. The
    row and col should be in the range 0..rows - 1 and 0..cols - 1."
  */
  GetChar : function(row, col) {
    if (row < 0 || row >= this.rows) {
      return null;
    }

    if (cols < 0 || col >= this.cols) {
      return null;
    }

    return this.screen[row][col];
  },

  /*
    Returns the terminal screen line specified by lineno. The line is
    returned as string, blank space represents empty character. The lineno
    should be in the range 0..rows - 1
  */
  GetLine : function(lineno) {
    if (lineno < 0 || lineno >= this.rows) {
      return null;
    }

    return this.screen[lineno].toString();  // todo
  },

  /*
    Returns terminal screen lines as a list, same as GetScreen
  */
  GetLines : function() {
    var lines = [];

    for (var i = 0; i < this.rows; ++i) {
      lines.push(this.screen[i].toString());  // todo
    }

    return lines;
  },

  /*
    Returns the entire terminal screen as a single big string. Each row
    is seperated by \\n and blank space represents empty character.
  */
  GetLinesAsText : function() {
    var text = "";

    for (var i = 0; i < this.rows; ++i) {
      text += this.screen[i].toString();  // todo
      text += '\n';
    }

    text = text.replace(/\n+$/g, ''); // removes leading new lines

    return text;
  },

  /*
    Returns list of dirty lines(line nos) since last call to GetDirtyLines.
    The line no will be 0..rows - 1.
  */
  GetDirtyLines : function() {
    var dirtyLines = [];

    for (var i = 0; i < this.rows; ++i) {
      if (this.isLineDirty[i]) {
        dirtyLines.push(i);
        this.isLineDirty[i] = false;
      }
    }

    return dirtyLines;
  },

  /*
    Processes the given input text. It detects V100 escape sequences and
    handles it. Any partial unparsed escape sequences are stored internally
    and processed along with next input text. Before leaving, the function
    calls the callbacks CALLBACK_UPDATE_LINE and CALLBACK_UPDATE_CURSOR_POS
    to update the changed lines and cursor position respectively.
  */
  ProcessInput : function(text) {
    if (!text) {
      return;
    }

    if (this.unparsedInput) {
      text = this.unparsedInput + text;
      this.unparsedInput = null;
    }

    var textlen = text.length;
    var index = 0;
    while (index < textlen) {
      var ch = text[index];
      var graphicsChar = false;

      if (this.graphicsCharactersMode && this.graphicsCharacters[ch]) {
        ch = this.graphicsCharacters[ch];
        graphicsChar = true;
      }

      var ascii = ch.charCodeAt(0);

      if (this.ignoreChars) {
        index += 1;
        continue;
      }

      if (this.charHandlers[ascii]) {
        index = this.charHandlers[ascii](text, index);
      } else {
        if (graphicsChar || this.printableChars.indexOf(ch) != -1) {
          this.__PushChar(ch);
        } else if (ascii > 127) {  // process UTF-8
          var utfSequence = ch;

          while (true) {
            ++index;

            if (index == text.length) {
              this.unparsedInput = utfSequence;
              break;  // we don't have enough characters to process the UTF-8 sequence properly yet
            }

            utfSequence += text[index];

            try {
              ch = decodeURIComponent(escape(utfSequence));
            } catch (ex) {
              var originalUtfSequence = utfSequence;
              // will throw URIError until the UTF-8 sequence is complete

              // first though, test for invalid sequences and replace with '?'
              // taken from http://stackoverflow.com/questions/2670037/how-to-remove-invalid-utf-8-characters-from-a-javascript-string
              // and modified to check for a lot of end of strings ($) since we might not get the whole sequence at once
              utfSequence = utfSequence.replace(/([\x09\x0A\x0D\x20-\x7E]|[\xC2-\xDF]([\x80-\xBF]|$)|\xE0([\xA0-\xBF]|$)([\x80-\xBF]|$)|[\xE1-\xEC\xEE\xEF]([\x80-\xBF]|$)([\x80-\xBF]|$)|\xED([\x80-\x9F]|$)([\x80-\xBF]|$)|\xF0([\x90-\xBF]|$)([\x80-\xBF]|$)([\x80-\xBF]|$)|[\xF1-\xF3]([\x80-\xBF]|$)([\x80-\xBF]|$)([\x80-\xBF]|$)|\xF4([\x80-\x8F]|$)([\x80-\xBF]|$)([\x80-\xBF]|$))|./g, "$1"); 

              if (utfSequence[0] != originalUtfSequence[0]) {
                ch = '?';
                --index; // we had to lookahead to see the next character. the regexp doesn't convert bad sequences that are at the end of the line
              } else {
                continue;
              }
            }

            this.__PushChar(ch, wcwidth(ch) > 1, true);
            break;
          }
        } else {
          debug('Unhandled character: ' + text[index].toSource());
        }
        index += 1;
      }
    }

    // update the dirty lines
    //if (this.callbacks[this.CALLBACK_UPDATE_LINES]) {
    //  this.callbacks[this.CALLBACK_UPDATE_LINES]();
    //}
  },

  /*
    Scrolls up the terminal screen by one line. The callbacks
    CALLBACK_UPDATE_LINES and CALLBACK_SCROLL_UP_SCREEN are called before
    scrolling the screen.
  */
  ScrollUp : function() {
    // update the dirty lines
    //if (this.callbacks[this.CALLBACK_UPDATE_LINES]) {
    //  this.callbacks[this.CALLBACK_UPDATE_LINES]();
    //}

    for (var x = 0; x < this.rows - 1; ++x) {
      this.isLineDirty[x] = this.isLineDirty[x + 1];
    }

    this.cursor.style.backgroundColor = '';

    var rendition;
    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      rendition = this.scrRendition.splice(this.scrollingRegion[0] - 1, 1);
      this.scrRendition.splice(this.scrollingRegion[1] - 1, 0, new cloneObject(this.blankHTML));
    } else {
      rendition = this.scrRendition.shift();
      this.scrRendition.push(new cloneObject(this.blankHTML));
    }
    var lineNo = this.scrollingRegion ? this.scrollingRegion[0] - 1 : 0;
    if (!rendition || this.isLineDirty[lineNo]) {
      rendition = this.createScreenRendition(lineNo);
    }
    if (!this.origScreen) {
      this.addHistory(rendition);
    }

    var line;
    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      line = this.screen.splice(this.scrollingRegion[0] - 1, 1);
    } else {
      line = this.screen.shift();
    }
    for (var i = 0; i < this.cols; ++i) {
      line[i] = new cloneObject(this.blank);
    }

    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      this.screen.splice(this.scrollingRegion[1] - 1, 0, line);
    } else {
      this.screen.push(line);
    }

    this.refresh = true;
  },

  /*
    Scrolls down the terminal screen by one line. The callbacks
    CALLBACK_UPDATE_LINES and CALLBACK_SCROLL_UP_SCREEN are called before
    scrolling the screen.
  */
  ScrollDown : function() {
    // update the dirty lines
    //if (this.callbacks[this.CALLBACK_UPDATE_LINES]) {
    //  this.callbacks[this.CALLBACK_UPDATE_LINES]();
    //}

    this.cursor.style.backgroundColor = '';

    var rendition;
    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      rendition = this.scrRendition.splice(this.scrollingRegion[1] - 1, 1);
      this.scrRendition.splice(this.scrollingRegion[0] - 1, 0, new cloneObject(this.blankHTML));
    } else {
      rendition = this.scrRendition.pop();
      this.scrRendition.unshift(new cloneObject(this.blankHTML));
    }

    var line;
    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      line = this.screen.splice(this.scrollingRegion[1] - 1, 1);
    } else {
      line = this.screen.pop();
    }
    for (var i = 0; i < this.cols; ++i) {
      line[i] = new cloneObject(this.blank);
    }
    if (this.scrollingRegion && this.scrollingRegion[1] < this.rows) {
      this.screen.splice(this.scrollingRegion[0] - 1, 0, line);
    } else {
      this.screen.unshift(line);
    }

    this.refresh = true;
  },

  /*
  Dump(self, file=sys.stdout):
    """
    Dumps the entire terminal screen into the given file/stdout
    """
    for i in range(self.rows):
        file.write(self.screen[i].tostring())
        file.write("\n")
  */

  /*
    Moves the cursor to the next line, if the cursor is already at the
    bottom row then scrolls up the screen.
  */
  __NewLine : function() {
    this.curX = 0;
    
    if (this.curY + 1 < this.rows) {
      this.curY += 1;
    } else {
      this.ScrollUp();
    }

    if (this.scrollingRegion && this.scrollingRegion != this.rows && this.scrollingRegion[1] == this.curY) {
      this.ScrollUp();
    }
  },

  /*
    Writes the character(ch) into current cursor position and advances
    cursor position.
  */
  __PushChar : function(ch, wideChar, nonAscii) {
    if (this.curX >= this.cols || (wideChar && this.curX + 1 >= this.cols)) {
      this.screen[this.curY][0].wrap = true;
      this.__NewLine();
    }

    ch = ch.replace(/\x20/g, "\u00A0");

    if (this.insertMode) {
      for (var x = this.cols - 1; x >= this.curX + 1; --x) {
        this.screen[this.curY][x] = this.screen[this.curY][x - 1];
      }
      this.screen[this.curY][this.curX] = new cloneObject(this.blank);
    }

    this.screen[this.curY][this.curX].c = ch;
    if (nonAscii) {
      var curRenditionNonAscii = new cloneObject(this.curRendition);
      curRenditionNonAscii.display = 'inline-block';
      curRenditionNonAscii.lineHeight = this.letterHeight + 'px';
      curRenditionNonAscii.width = (this.letterWidth * (wideChar ? 2 : 1)) + 'px';
      this.screen[this.curY][this.curX].style =
          this.curRendition.noStyle ? (wideChar ? this.nonAsciiWideStyle : this.nonAsciiStyle) : curRenditionNonAscii;

      if (wideChar) {
        this.screen[this.curY][this.curX + 1].c = '';
        this.screen[this.curY][this.curX + 1].style = this.hideStyle;
        this.curX += 2;
      } else {
        this.curX += 1;
      }
    } else {
      this.screen[this.curY][this.curX].style = this.curRendition.noStyle ? this.resetStyle : this.curRendition;
      this.curX += 1;
    }

    this.isLineDirty[this.curY] = true;
  },

  /*
    Parses escape sequence from the input and returns the index after escape
    sequence, the escape sequence character and parameter for the escape
    sequence
  */
  __ParseEscSeq : function(text, index) {
    var textlen = text.length;
    var interChars = null;
    while (index < textlen) {
      var ch = text[index];
      var ascii = ch.charCodeAt(0);

      if (ascii >= 32 && ascii <= 63) {
        // intermediate char (32 - 47)
        // parameter chars (48 - 63)
        if (!interChars) {
          interChars = ch;
        } else {
          interChars += ch;
        }
      } else if (ascii >= 64 && ascii <= 125) {
        // final char
        return [index + 1, String.fromCharCode(ascii), interChars];
      } else {
        debug("Unexpected characters in escape sequence " + ch.toSource());
      }

      index += 1;
    }

    // the escape sequence is not complete, inform this to caller by giving
    // '?' as final char
    return [index, '?', interChars];
  },

  /*
    Parses operating system command from the input and returns the index after escape
    sequence, the escape sequence character and parameter for the escape
    sequence
  */
  __ParseOSCSeq : function(text, index) {
    var textlen = text.length;
    var interChars = null;

    while (index < textlen) {
      var ch = text[index];
      var ascii = ch.charCodeAt(0);

      if (ascii == this.__ASCII_BEL || (index + 1 < textlen &&
          ascii == this.__ASCII_ESC && text[index + 1] == '\\')) {
        index += 1;
        if (ascii != this.__ASCII_BEL) {
          index += 1;
        }
        return [index, '-', interChars];
      } else {
        if (!interChars) {
          interChars = ch;
        } else {
          interChars += ch;
        }
      }

      index += 1;
    }

    // the escape sequence is not complete, inform this to caller by giving
    // '?' as final char
    return [index, '?', interChars];
  },

  /*
    Handles an operating system command, either changing the title or changing
    the color palette.
  */
  __HandleOSC : function(text) {
    var type = text[0];
    var str = text.substring(2);
    if (type == '0' || type == '1' || type == '2') {
      this.__OnEscSeqTitle(str);
    } else if (type == '4') {
      this.__OnEscSeqColorSet(str);
    } else {
      debug('Unhandled type for ] escape: ' + type);
    }
  },

  /*
    Tries to parse escape sequence from input and if its not complete then
    puts it in unparsedInput and process it when the ProcessInput called
    next time.
  */
  __HandleEscSeq : function(text, index) {
  
    //console.log('esc '+JSON.stringify(text.substring(index,index+7)));
    if (text[index] == '[' || text[index] == ']') {
      var initialChar = text[index];
      index += 1;
      var result = initialChar == '[' ? this.__ParseEscSeq(text, index) :
          this.__ParseOSCSeq(text, index);
      index = result[0];
      var finalChar = result[1];
      var interChars = result[2];

      if (finalChar == '?') {
        this.unparsedInput = "\033" + initialChar;
        if (interChars) {
          this.unparsedInput += interChars;
        }
      } else if (initialChar == '[' && this.escSeqHandlers[finalChar]) {
        this.escSeqHandlers[finalChar](interChars);
      } else if (initialChar == ']') {
        this.__HandleOSC(interChars);
      } else {
        var escSeq = "";
        if (interChars) {
          escSeq += interChars;
        }

        escSeq += finalChar;

        //if (this.callbacks[this.CALLBACK_UNHANDLED_ESC_SEQ]) {
        //  this.callbacks[this.CALLBACK_UNHANDLED_ESC_SEQ](escSeq);
        //}
        debug('Unhandled ' + initialChar + ' escape: ' + JSON.stringify(escSeq));
      }
    } else if (text[index] == 'D') {  // index IND, scroll up, same as SU
      index += 1;
      this.escSeqHandlers['S']();
    } else if (text[index] == 'M') {  // revindex RI, scroll down, same as SD
      index += 1;
      this.escSeqHandlers['T']();
    } else if (['>', '=', '7', '8'].indexOf(text[index]) != -1) {  // ignore, DECPNM, DECPAM, DECSC, DECRC
      index += 1;
    } else if (text[index] == '(') {  // setusg0, setspecg0
      if (this.escParenSeqHandlers[text[index + 1]]) {
        this.escParenSeqHandlers[text[index + 1]]();
      }
      index += 2;
    } else {
      if (text[index]) {
        debug('Unhandled reg. escape: ' + text[index].toSource());
      }
    }

    return index;
  },

  /*
    Handler for bell character
  */
  belAudio : null,
  enableBell : true,
  __OnCharBel : function(text, index) {
    if (!this.enableBell) {
      return index + 1;
    }

    if (this.belAudio) {
      vca.gain.value = 0.1;
      setTimeout(function() { vca.gain.value = 0; }, 33);
    } else {
      var context = new AudioContext();

      var vco = context.createOscillator();
      vco.type = vco.SINE;
      vco.frequency.value = 4000;
      vco.start(0);

      vca = context.createGain();
      vca.gain.value = 0;

      vco.connect(vca);
      vca.connect(context.destination);

      vca.gain.value = 0.1;
      setTimeout(function() { vca.gain.value = 0; }, 33);

      this.belAudio = vca;
    }

    return index + 1;
  },

  /*
    Handler for backspace character
  */
  __OnCharBS : function(text, index) {
    if (this.curX > 0) {
      this.curX -= 1;
    }

    return index + 1;
  },

  /*
    Handler for horizontal tab character
  */
  __OnCharHT : function(text, index) {
    while (true) {
      this.curX += 1;
      if (this.curX % 8 == 0) {
        break;
      }
    }
    return index + 1;
  },

  /*
    Handler for line feed character
  */
  __OnCharLF : function(text, index) {
    this.__NewLine();
    return index + 1;
  },

  /*
    Handler for carriage return character
  */
  __OnCharCR : function(text, index) {
    this.curX = 0;
    return index + 1;
  },

  /*
    Handler for XON character
  */
  __OnCharXON : function(text, index) {
    this.ignoreChars = false;
    return index + 1;
  },

  /*
    Handler for XOFF character
  */
  __OnCharXOFF : function(text, index) {
    this.ignoreChars = true;
    return index + 1;
  },

  /*
    Handler for escape character
  */
  __OnCharESC : function(text, index) {
    index += 1;
    if (index < text.length) {
      index = this.__HandleEscSeq(text, index);
    }

    return index;
  },

  /*
    Handler for control sequence introducer(CSI) character
  */
  __OnCharCSI : function(text, index) {
    index += 1;
    index = this.__HandleEscSeq(text, index);
    return index;
  },

  /*
    Dummy handler for unhandler characters
  */
  __OnCharIgnore : function(text, index) {
    return index + 1;
  },

  /*
    Handler for window title escape sequence
  */
  __OnEscSeqTitle : function(params) {
    document.title = params + " - FireSSH";
  },

  /*
    Handler for escape sequence ICH
  */
  __OnEscSeqICH : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = this.cols - 1; x >= this.curX + n; --x) {
      this.screen[this.curY][x] = this.screen[this.curY][x - n];
    }
    for (var x = this.curX + n - 1; x >= this.curX; --x) {
      this.screen[this.curY][x] = new cloneObject(this.blank);
    }

    this.isLineDirty[this.curY] = true;
  },

  /*
    Handler for escape sequence CUU
  */
  __OnEscSeqCUU : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    this.curY -= n;
    if (this.curY < 0) {
      this.curY = 0;
    }
  },

  /*
    Handler for escape sequence CUD
  */
  __OnEscSeqCUD : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    this.curY += n;
    if (this.curY >= this.rows) {
      this.curY = this.rows - 1;
    }
  },

  /*
    Handler for escape sequence CUF
  */
  __OnEscSeqCUF : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    this.curX += n;
    if (this.curX >= this.cols) {
      this.curX = this.cols - 1;
    }
  },

  /*
    Handler for escape sequence CUB
  */
  __OnEscSeqCUB : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    this.curX -= n;
    if (this.curX < 0) {
      this.curX = 0;
    }
  },

  /*
    Handler for escape sequence CHA
  */
  __OnEscSeqCHA : function(params) {
    if (params == null) {
      //print "WARNING: CHA without parameter"
      return;
    }

    var col = parseInt(params);

    // convert it to zero based index
    col -= 1;
    if (col >= 0 && col < this.cols) {
      this.curX = col;
    } else {
      //print "WARNING: CHA column out of boundary"
    }
  },

  /*
    Handler for escape sequence CUP
  */
  __OnEscSeqCUP : function(params) {
    var y = 0;
    var x = 0;

    if (params != null) {
      var values = params.split(';');
      if (values.length == 2) {
        y = parseInt(values[0]) - 1;
        x = parseInt(values[1]) - 1;
      } else {
        //print "WARNING: escape sequence CUP has invalid parameters"
        return;
      }
    }

    if (x < 0) {
      x = 0;
    } else if (x >= this.cols) {
      x = this.cols - 1;
    }

    if (y < 0) {
      y = 0;
    } else if (y >= this.rows) {
      y = this.rows - 1;
    }

    this.curX = x;
    this.curY = y;
  },

  /*
    Handler for escape sequence ED
  */
  __OnEscSeqED : function(params) {
    var n = 0;
    if (params != null) {
      n = parseInt(params);
    }

    if (n == 0) {
      this.ClearRect(this.curY, this.curX, this.rows - 1, this.cols - 1);
    } else if (n == 1) {
      this.ClearRect(0, 0, this.curY, this.curX);
    } else if (n == 2) {
      this.ClearRect(0, 0, this.rows - 1, this.cols - 1);
    } else {
      //print "WARNING: escape sequence ED has invalid parameter"
    }
  },

  /*
    Handler for escape sequence IL
  */
  __OnEscSeqIL : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = 0; x < n; ++x) {
      this.ScrollDown();
    }
  },

  /*
    Handler for escape sequence DL
  */
  __OnEscSeqDL : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = 0; x < n; ++x) {
      this.ScrollUp();
    }
  },

  /*
    Handler for escape sequence DCH
  */
  __OnEscSeqDCH : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = this.curX; x < this.cols - n; ++x) {
      this.screen[this.curY][x] = this.screen[this.curY][x + n];
    }
    for (var x = this.cols - n; x < this.cols; ++x) {
      this.screen[this.curY][x] = new cloneObject(this.blank);
    }

    this.isLineDirty[this.curY] = true;
  },

  /*
    Handler for escape sequence SU
  */
  __OnEscSeqSU : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = 0; x < n; ++x) {
      this.ScrollUp();
    }
  },

  /*
    Handler for escape sequence SD
  */
  __OnEscSeqSD : function(params) {
    var n = 1;
    if (params != null) {
      n = parseInt(params);
    }

    for (var x = 0; x < n; ++x) {
      this.ScrollDown();
    }
  },

  /*
    Handler for escape sequence EL
  */
  __OnEscSeqEL : function(params) {
    var n = 0;
    if (params != null) {
      n = parseInt(params);
    }

    if (n == 0) {
      this.ClearRect(this.curY, this.curX, this.curY, this.cols - 1);
    } else if (n == 1) {
      this.ClearRect(this.curY, 0, this.curY, this.curX);
    } else if (n == 2) {
      this.ClearRect(this.curY, 0, this.curY, this.cols - 1);
    } else {
      //print "WARNING: escape sequence EL has invalid parameter"
    }
  },

  /*
    Handler for escape sequence VPA
  */
  __OnEscSeqVPA : function(params) {
    if (params == null) {
      //print "WARNING: VPA without parameter"
      return;
    }

    var row = parseInt(params);

    // convert it to zero based index
    row -= 1;
    if (row >= 0 && row < this.rows) {
      this.curY = row;
    } else {
      //print "WARNING: VPA line no. out of boundary"
    }
  },

  /*
    Handler for escape sequence DECSET
  */
  __OnEscSeqDECSET : function(params) {
    if (params == null) {
      //print "WARNING: VPA without parameter"
      return;
    }
    if (params[0] == '?') {
      params = params.substring(1).split(';');
      if (params.indexOf('1049') != -1) {
        this.origScreen = this.screen;
        this.origScrRendition = this.scrRendition;
        this.screen = [];
        this.scrRendition = [];

        for (var i = 0; i < this.rows; ++i) {
          var line = [];

          for (var j = 0; j < this.cols; ++j) {
            line.push(new cloneObject(this.blank));
          }

          this.screen.push(line);
          this.scrRendition.push(new cloneObject(this.blankHTML));
          this.isLineDirty[i] = false;
        }

        this.refresh = true;
        
        // XXX hack for now, we ignore scrolling region by telling shell to resize again
        //gConnection.shell.resize_pty(this.cols, this.rows - 1);
        //gConnection.shell.resize_pty(this.cols, this.rows);
      }
    } else {
      params = params.split(';');
      if (params.indexOf('4') != -1) {
        this.insertMode = true;
      }
    }
    //this.onTerminalReset();
    //this.updateScreen(true);
  },

  /*
    Handler for escape sequence DECRST
  */
  __OnEscSeqDECRST : function(params) {
    if (params == null) {
      //print "WARNING: VPA without parameter"
      return;
    }
    if (params[0] == '?') {
      params = params.substring(1).split(';');
      if (params.indexOf('1049') != -1) {
        this.screen = this.origScreen;
        this.scrRendition = this.origScrRendition;

        this.origScreen = null;
        this.origScrRendition = null;
        this.refresh = true;
      }
    } else {
      params = params.split(';');
      if (params.indexOf('4') != -1) {
        this.insertMode = false;
      }
    }

    //this.onTerminalReset();
    //this.updateScreen(true);
  },

  xtermColors : [
    '#000000', '#c23621', '#25bc24', '#cc7920', '#492ee1',
    '#d338d3', '#33bbc8', '#c0c0c0', '#808080', '#ff0000',
    '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff',
    '#ffffff', '#000000', '#00005f', '#000087', '#0000af',
    '#0000df', '#0000ff', '#005f00', '#005f5f', '#005f87',
    '#005faf', '#005fdf', '#005fff', '#008700', '#00875f',
    '#008787', '#0087af', '#0087df', '#0087ff', '#00af00',
    '#00af5f', '#00af87', '#00afaf', '#00afdf', '#00afff',
    '#00df00', '#00df5f', '#00df87', '#00dfaf', '#00dfdf',
    '#00dfff', '#00ff00', '#00ff5f', '#00ff87', '#00ffaf',
    '#00ffdf', '#00ffff', '#5f0000', '#5f005f', '#5f0087',
    '#5f00af', '#5f00df', '#5f00ff', '#5f5f00', '#5f5f5f',
    '#5f5f87', '#5f5faf', '#5f5fdf', '#5f5fff', '#5f8700',
    '#5f875f', '#5f8787', '#5f87af', '#5f87df', '#5f87ff',
    '#5faf00', '#5faf5f', '#5faf87', '#5fafaf', '#5fafdf',
    '#5fafff', '#5fdf00', '#5fdf5f', '#5fdf87', '#5fdfaf',
    '#5fdfdf', '#5fdfff', '#5fff00', '#5fff5f', '#5fff87',
    '#5fffaf', '#5fffdf', '#5fffff', '#870000', '#87005f',
    '#870087', '#8700af', '#8700df', '#8700ff', '#875f00',
    '#875f5f', '#875f87', '#875faf', '#875fdf', '#875fff',
    '#878700', '#87875f', '#878787', '#8787af', '#8787df',
    '#8787ff', '#87af00', '#87af5f', '#87af87', '#87afaf',
    '#87afdf', '#87afff', '#87df00', '#87df5f', '#87df87',
    '#87dfaf', '#87dfdf', '#87dfff', '#87ff00', '#87ff5f',
    '#87ff87', '#87ffaf', '#87ffdf', '#87ffff', '#af0000',
    '#af005f', '#af0087', '#af00af', '#af00df', '#af00ff',
    '#af5f00', '#af5f5f', '#af5f87', '#af5faf', '#af5fdf',
    '#af5fff', '#af8700', '#af875f', '#af8787', '#af87af',
    '#af87df', '#af87ff', '#afaf00', '#afaf5f', '#afaf87',
    '#afafaf', '#afafdf', '#afafff', '#afdf00', '#afdf5f',
    '#afdf87', '#afdfaf', '#afdfdf', '#afdfff', '#afff00',
    '#afff5f', '#afff87', '#afffaf', '#afffdf', '#afffff',
    '#df0000', '#df005f', '#df0087', '#df00af', '#df00df',
    '#df00ff', '#df5f00', '#df5f5f', '#df5f87', '#df5faf',
    '#df5fdf', '#df5fff', '#df8700', '#df875f', '#df8787',
    '#df87af', '#df87df', '#df87ff', '#dfaf00', '#dfaf5f',
    '#dfaf87', '#dfafaf', '#dfafdf', '#dfafff', '#dfdf00',
    '#dfdf5f', '#dfdf87', '#dfdfaf', '#dfdfdf', '#dfdfff',
    '#dfff00', '#dfff5f', '#dfff87', '#dfffaf', '#dfffdf',
    '#dfffff', '#ff0000', '#ff005f', '#ff0087', '#ff00af',
    '#ff00df', '#ff00ff', '#ff5f00', '#ff5f5f', '#ff5f87',
    '#ff5faf', '#ff5fdf', '#ff5fff', '#ff8700', '#ff875f',
    '#ff8787', '#ff87af', '#ff87df', '#ff87ff', '#ffaf00',
    '#ffaf5f', '#ffaf87', '#ffafaf', '#ffafdf', '#ffafff',
    '#ffdf00', '#ffdf5f', '#ffdf87', '#ffdfaf', '#ffdfdf',
    '#ffdfff', '#ffff00', '#ffff5f', '#ffff87', '#ffffaf',
    '#ffffdf', '#ffffff', '#080808', '#121212', '#1c1c1c',
    '#262626', '#303030', '#3a3a3a', '#444444', '#4e4e4e',
    '#585858', '#606060', '#666666', '#767676', '#808080',
    '#8a8a8a', '#949494', '#9e9e9e', '#a8a8a8', '#b2b2b2',
    '#bcbcbc', '#c6c6c6', '#d0d0d0', '#dadada', '#e4e4e4',
    '#eeeeee' ],

  /*
    Handler for escape sequence SGR
  */
  __OnEscSeqSGR : function(params) {
    if (params != null) {
      var renditions = params.split(';');
      for (var x = 0; x < renditions.length; ++x) {
        var rendition = renditions[x];
        var irendition = parseInt(rendition);
        if (irendition) {
          if (this.curRendition.noStyle) {
            this.curRendition = new cloneObject(this.resetStyle);
            this.curRendition.noStyle = false;
          } else {
            this.curRendition = new cloneObject(this.curRendition);
          }
        }

        switch (irendition) {
          case 0:
            this.curRendition = this.resetStyle;
            this.negativeColors = false;
            break;
          case 1:
            this.curRendition.fontWeight = 'bold';
            if (getPlatform() == 'mac') {
              this.curRendition.letterSpacing = '-0.5px';
            }
            break;
          case 2:
            this.curRendition.opacity = '.5';
            break;
          case 3:
            this.curRendition.fontStyle = 'italic';
            break;
          case 4:
            this.curRendition.textDecoration = 'underline';
            break;
          case 5:
          case 6:
            this.curRendition.textDecoration = 'blink'; // god forgive me
            break;
          case 7:
            this.negativeColors = true;
            var tempColor = this.curRendition.color ? this.curRendition.color : this.defaultColor;
            this.curRendition.color = this.curRendition.backgroundColor ? this.curRendition.backgroundColor : this.defaultBGColor;
            this.curRendition.backgroundColor = tempColor;
            break;
          case 8:
            this.curRendition.visibility = 'hidden';
            break;
          case 9:
            this.curRendition.textDecoration = 'line-through';
            break;
          case 21:
            this.curRendition.fontWeight = 'normal';
            break;
          case 22:
            this.curRendition.fontWeight = 'normal';
            this.curRendition.opacity = '1';
            break;
          case 23:
            this.curRendition.fontStyle = 'normal';
            break;
          case 24:
          case 25:
            this.curRendition.textDecoration = 'none';
            break;
          case 27:
            var wasNegative = this.negativeColors == true;
            this.negativeColors = false;
            var tempColor = this.curRendition.color && wasNegative ? this.curRendition.color : this.defaultBGColor;
            this.curRendition.color = this.curRendition.backgroundColor && wasNegative ? this.curRendition.backgroundColor : this.defaultColor;
            this.curRendition.backgroundColor = tempColor;
            break;
          case 28:
            this.curRendition.visibility = 'visible';
            break;
          case 29:
            this.curRendition.textDecoration = 'none';
            break;
          case 30:
          case 31:
          case 32:
          case 33:
          case 34:
          case 35:
          case 36:
          case 37:
            if (this.negativeColors) {
              this.curRendition.backgroundColor = this.xtermColors[irendition - 30];
            } else {
              this.curRendition.color = this.xtermColors[irendition - 30];
            }
            break;
          case 38:
          case 48:
            if (renditions.length < 3) {
              return;
            }
            var color;
            var isRgb = parseInt(renditions[1]) == 2;
            if (isRgb) {
              color = 'rgb(' +
                  parseInt(renditions[2]) + ',' +
                  parseInt(renditions[3]) + ',' +
                  parseInt(renditions[4]) + ')';
            } else {
              color = this.xtermColors[parseInt(renditions[2])];
            }
            if (irendition == 38) {
              this.curRendition.color = color;
            } else {
              this.curRendition.backgroundColor = color;
            }
            return;
          case 39:
            if (this.negativeColors) {
              this.curRendition.backgroundColor = '';
            } else {
              this.curRendition.color = '';
            }
            break;
          case 40:
          case 41:
          case 42:
          case 43:
          case 44:
          case 45:
          case 46:
          case 47:
            if (this.negativeColors) {
              this.curRendition.color = this.xtermColors[irendition - 40];
            } else {
              this.curRendition.backgroundColor = this.xtermColors[irendition - 40];
            }
            break;
          case 49:
            if (this.negativeColors) {
              this.curRendition.color = '';
            } else {
              this.curRendition.backgroundColor = '';
            }
            break;
          case 90:
          case 91:
          case 92:
          case 93:
          case 94:
          case 95:
          case 96:
          case 97:
            if (this.negativeColors) {
              this.curRendition.backgroundColor = this.xtermColors[irendition - 82];
            } else {
              this.curRendition.color = this.xtermColors[irendition - 82];
            }
            break;
          case 100:
          case 101:
          case 102:
          case 103:
          case 104:
          case 105:
          case 106:
          case 107:
            if (this.negativeColors) {
              this.curRendition.color = this.xtermColors[irendition - 92];
            } else {
              this.curRendition.backgroundColor = this.xtermColors[irendition - 92];
            }
            break;
          default:
            break;
        }
      }
    } else {
      // reset rendition
      this.curRendition = this.resetStyle;
      this.negativeColors = false;
    }

    //print "Current attribute", self.curAttrib
  },

  /*
    Handler for OSC setting color
  */
  __OnEscSeqColorSet : function(str) {
    str = str.split(';');
    var colorToSet = parseInt(str[0]);
    var parsedColor = str[1];
    // String can be of the form: rgb:00/00/00
    parsedColor = parsedColor.replace('rgb:', '');
    parsedColor = parsedColor.replace(/\//g, '');
    if (parsedColor.indexOf('#') != 0) {
      parsedColor = '#' + parsedColor;
    }
    this.xtermColors[colorToSet] = parsedColor;
  },

  /*
    Handler for Scrolling region
  */
  __OnEscSeqDECSTBM : function(params) {
    if (params != null) {
      var region = params.split(';');
      var scrollingRegion = [parseInt(region[0]), parseInt(region[1])];
      if (region[0] != 1 || region[1] != this.rows) {
        this.scrollingRegion = scrollingRegion;
      } else {
        this.scrollingRegion = null;
      }
    }
  },

  /*
    Handler for window manipulation
  */
  __OnEscSeqDECWINMAN : function(params) {
    if (params != null) {
      params = params.split(';');
      if (params[0] == '8') {
        var width  = parseInt(params[2]) * this.letterWidth  + 12;
        var height = parseInt(params[1]) * this.letterHeight + 7;

        window.resizeTo(width, height);
      }
    }
  },

  /*
    Set United States G0 character set
  */
  __OnEscParenSeqUsg0 : function() {
    this.graphicsCharactersMode = false;
  },

  /*
    Set G0 special chars. & line set
  */
  __OnEscParenSeqSpecg0 : function() {
    this.graphicsCharactersMode = true;
  },

  onFocus : function() {
    this.isFocused = true;

    if (this.cursor && this.initialScroll) {
      /*this.cursor.style.border = "";
      this.cursor.style.top = (parseInt(this.cursor.style.top) + 1) + 'px';
      this.cursor.style.left = (parseInt(this.cursor.style.left) + 1) + 'px';
      this.cursor.style.backgroundColor = this.defaultColor;*/
    }

    this.input.focus();
  },

  onBlur : function() {
    this.isFocused = false;

    if (this.cursor && this.initialScroll) {
      /*this.cursor.style.border = "1px solid " + this.defaultColor;
      this.cursor.style.top = (parseInt(this.cursor.style.top) - 1) + 'px';
      this.cursor.style.left = (parseInt(this.cursor.style.left) - 1) + 'px';
      this.cursor.style.backgroundColor = "";*/
    }
  },

  onResize : function(initOnly) {
    var cols = parseInt((this.body.clientWidth - 12) / this.letterWidth);
    var rows = parseInt((this.body.clientHeight - 7) / this.letterHeight);

    var widthDiff  = (this.body.clientWidth - 12) % this.letterWidth;
    var heightDiff = (this.body.clientHeight - 7) % this.letterHeight;

    this.terminal.style.paddingBottom = heightDiff + 'px';

    if (initOnly) {
      this.rows = rows;
      this.cols = cols;
      
      return;
    }

    if (rows == this.rows && cols == this.cols) {
      return;
    }

    this.Resize(rows, cols);

    if (gConnection && gConnection.isConnected && gConnection.isReady) {
      gConnection.shell.resize_pty(cols, rows);
    }
  },

  resetAppearance : function(init) {
    //this.body.style.font = this.fontSize + "px " + this.font;
    this.body.style.fontSize = this.fontSize + "px";
    this.body.style.backgroundColor = this.defaultBGColor;
    this.body.style.color = this.defaultColor;
    this.input.style.color = this.defaultColor;

    this.captureFontSize();

    this.onResize();
  }
};
