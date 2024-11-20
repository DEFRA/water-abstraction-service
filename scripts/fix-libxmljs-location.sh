#!/bin/bash

# There is an issue with the package libxmljs version 0.19.10 where the binary isn't placed in the correct location
# when running locally. This script fixes that issue

echo "Checking if we need to move the libxmljs binary"
#if [ -e ./node_modules/libxmljs/build/Release/xmljs.node ]
#  then
#    echo "Binary is found, nothing to do"
#  else
#    cp ./node_modules/libxmljs/build/Release/obj.target/xmljs.node ./node_modules/libxmljs/build/Release/xmljs.node
#    echo "Copied binary"
#fi

# Work out if this is needed after every install or just once
# npm rebuild libxmljs2 --build-from-source
