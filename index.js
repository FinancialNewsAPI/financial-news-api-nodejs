#!/usr/bin/env node

const assert = require('assert');
const axios = require('axios');
const events = require('events');
const WebSocket = require('ws');

const store = {
  apiKey: '',
  searchApiEndpoint: 'https://api.newsfilter.io/search',
  streamApiEndpointWebsocket:
    'ws://stream.newsfilter.io/socket.io/?EIO=3&transport=websocket',
};

const getNews = async (query) => {
  assert(store.apiKey && store.apiKey.length, 'No API key defined');
  assert(typeof query === 'object', 'query needs to be an object');

  const fullApiUrl = store.searchApiEndpoint + '?token=' + store.apiKey;

  const response = await axios.post(fullApiUrl, query);

  return response.data;
};

const SearchApi = (apiKey) => {
  store.apiKey = apiKey;

  return {
    getNews,
  };
};

module.exports.SearchApi = SearchApi;

const StreamApi = (apiKey) => {
  store.apiKey = apiKey;

  const eventEmitter = new events.EventEmitter();

  const streamServerUrl =
    store.streamApiEndpointWebsocket + '&apiKey=' + store.apiKey;

  const streamApiClient = new WebSocket(streamServerUrl);

  const heartbeat = setInterval(() => {
    streamApiClient.send(40);
  }, 20000);

  streamApiClient.on('error', (error) => {
    eventEmitter.emit('error', error.toString());
  });

  streamApiClient.on('open', () => {
    eventEmitter.emit('open');
  });

  streamApiClient.on('close', () => {
    clearTimeout(heartbeat);
    eventEmitter.emit('close');
  });

  streamApiClient.on('message', (buf) => {
    try {
      const bufString = buf.toString();

      // only listen to "42" content messages
      if (!bufString.startsWith('42')) {
        return;
      }

      const message = JSON.parse(bufString.replace(/^[\d]+/g, ''));

      if (message[0] === 'articles') {
        const articles = message[1].articles;
        eventEmitter.emit('articles', articles);
      }
    } catch (error) {
      eventEmitter.emit('error', error.toString());
    }
  });

  return eventEmitter;
};

module.exports.StreamApi = StreamApi;
