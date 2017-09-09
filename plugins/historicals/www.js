const express = require('express');
const app = express();
const config = require('./config');

app.listen(config.port);