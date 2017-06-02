#!/usr/bin/env bash
npm uninstall grunt
npm uninstall mimer
npm uninstall es5-ext
npm install -g grunt --save
npm install
npm install --save sails-hook-parametized-policies
sudo grunt prod
sudo chmod -R 0755 ./data
sudo chown -R $USER ./data
sudo chmod -R 701 ./.tmp
sudo chown -R 501 ./.tmp
sudo chmod -R 701 ./views
sudo chown -R 501 ./views
