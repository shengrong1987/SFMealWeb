#!/usr/bin/env bash
npm uninstall bcrypt
npm install
chown -R 500 ./views
chown -R 500 ./.tmp