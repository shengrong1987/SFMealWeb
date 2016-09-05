#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm uninstall sails-hook-jobs
npm uninstall mimer
npm uninstall es5-ext
npm uninstall moment-timezone
npm install sails-hook-jobs
npm install -g grunt --save
npm install
npm install --save sails-hook-parametized-policies
sudo grunt prod
sudo chown -R $USER ./data
sudo chmod -R 700 ./data
sudo chmod -R 500 ./.tmp
sudo chmod -R 500 ./views
