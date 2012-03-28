#!/bin/bash

FIRESSH_VER=0.90
FIRESSH_MIN=4.0b1
FIRESSH_MAX=10.*
FIRESSH_MASTER=0
FIRESSH_DEBUG=0

# build English-only
FIRESSH_LANG=en-US
source build_helper.sh

# build all locales
FIRESSH_LANG=all
FIRESSH_MASTER=1
source build_helper.sh
