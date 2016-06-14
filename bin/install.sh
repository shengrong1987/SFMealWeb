#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm install
npm install --save sails-hook-parametized-policies
chown -R 500 ./data
chown -R 500 ./views
chown -R 500 ./.tmp
