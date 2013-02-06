#!/bin/bash

sed -e s/__VERSION__/$FIRESSH_VER/g content/js/etc/globals.js.in > content/js/etc/globals.js

rm ../downloads/firessh_chrome.zip

zip -q -r9 ../downloads/firessh_chrome.zip \
  _locales \
  background.js \
  content \
  fancy-settings \
  fancy-settings\LICENSE.txt \
  fancy-settings\source \
  license.txt \
  manifest.json \
  skin \
  -x "*/CVS/*" "*/resources/*" "*.in" "*.DS_Store" "*.swp" "*/.git/*" "*.gitignore"
