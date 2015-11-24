#!/bin/bash

mkdir chrome

cp chrome.manifest.master chrome.manifest

cp -R icons chrome/icons

sed -e s/__l10n__/$FIRESSH_LANG/g \
    -e s/__VERSION__/$FIRESSH_VER/g \
    -e s/__MINVERSION__/$FIRESSH_MIN/g \
    -e s/__MAXVERSION__/$FIRESSH_MAX/g \
    install.rdf.in > install.rdf

sed -e s/__VERSION__/$FIRESSH_VER/g content/js/etc/globals.js.in > content/js/etc/globals.js

rm ../downloads/firessh_$FIRESSH_LANG.xpi


zip -q -r9 ../downloads/firessh_$FIRESSH_LANG.xpi \
  content \
  locale/cs \
  locale/da \
  locale/en-US \
  locale/fr \
  locale/it-IT \
  locale/ja-JP \
  locale/pt-PT \
  locale/sv-SE \
  locale/tr \
  locale/zh-CN \
  skin \
  chrome/icons/default/firessh-main-window.ico \
  chrome/icons/default/firessh-main-window.xpm \
  components/sshProtocol.js \
  defaults/preferences/firessh.js \
  chrome.manifest \
  install.rdf \
  license.txt \
  -x "*/CVS/*" "*.in" "*.DS_Store" "*.swp" "*/.git/*" "*.gitignore"

rm -rf chrome
