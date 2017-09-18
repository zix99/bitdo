#!/bin/bash
set -e

pushd plugins/web
npm install
popd

pushd exchanges/gdax
npm install
popd

pushd exchanges/bittrex
npm install
popd

pushd exchanges/mock
npm install
popd
