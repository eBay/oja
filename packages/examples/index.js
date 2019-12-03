'use strict';

const express = require('express');
const app = express();
require('marko/node-require').install();
require('app-module-path').addPath(process.cwd());

const { createExpressHandler } = require('src/app-context');

/*
  This page should show product page on an imaginary shopping site.
  The page needs to get the following information to render the page given an item id in the URL:
  - Item details such as description, location, seller id obtained from item details service by itemId.
  - Seller information (name, rating) obtained from seller information service by seller id.
  - Buyer information (name, location) obtained from user information service by buyer id.
  - Shipping rates obtained from shippipng service using buyer's and seller's locations.
*/
app.get('/item', createExpressHandler('item'));
app.get('/error', createExpressHandler('error'));

app.listen(8000, () => {
    console.log('The server is ready');
});