#!/usr/bin/env bash
npm uninstall mimer
npm uninstall es5-ext
npm install -g grunt-cli
npm install -g grunt --save-dev
npm install
npm install --save sails-hook-parametized-policies
sudo chown -R $USER:$USER .
/usr/local/bin/grunt prod
