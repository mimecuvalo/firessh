#!/bin/bash

FIRESSH_VER=0.94.4
FIRESSH_MIN=25.0
FIRESSH_MAX=26.*
FIRESSH_MASTER=0
FIRESSH_DEBUG=0

# build English-only
FIRESSH_LANG=en-US
source build_helper.sh

# build all locales
FIRESSH_LANG=all
FIRESSH_MASTER=1
source build_helper.sh
