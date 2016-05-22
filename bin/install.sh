#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm install
chown -R 500 ./data
chown -R 500 ./views
chown -R 500 ./.tmp
