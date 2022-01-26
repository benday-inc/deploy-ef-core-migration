#!/bin/bash

unzip -o ./build-output.zip -d ../build-output/
cp ./__tests__/sample-appsettings-with-connection-strings.json ../build-output/appsettings.json
