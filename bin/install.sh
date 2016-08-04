#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm install
npm install --save sails-hook-parametized-policies
npm install -g grunt
sudo chown -R 501 ./data
sudo chown -R 501 ./views
sudo chown -R 501 ./.tmp
