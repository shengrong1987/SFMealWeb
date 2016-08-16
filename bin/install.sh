#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm uninstall sails-hook-jobs
npm uninstall mimer
npm uninstall es5-ext
npm uninstall moment-timezone
npm install sails-hook-jobs
npm install
npm install --save sails-hook-parametized-policies
npm install -g grunt
sudo chown -R 501 ./data
sudo chown -R 501 ./.tmp
sudo chown -R 501 ./views
sudo grunt prod
