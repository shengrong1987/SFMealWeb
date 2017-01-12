#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm uninstall mimer
npm uninstall es5-ext
npm uninstall moment-timezone
npm install -g grunt --save
npm install
npm install --save sails-hook-parametized-policies
sudo grunt prod
sudo chmod -R 700 ./data
sudo chown -R $USER ./data
sudo chmod -R 501 ./.tmp
sudo chmod -R 501 ./views
