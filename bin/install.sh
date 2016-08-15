#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm uninstall sails-hook-jobs
npm uninstall moment-timezone
npm install sails-hook-jobs
npm install
npm install --save sails-hook-parametized-policies
npm install -g grunt
sudo chown -R $USER ./views
sudo chown -R $USER ./.tmp
sudo chown -R $USER ./data
