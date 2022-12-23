const { SearchApi, StreamApi } = require('./index');

const API_KEY = 'YOUR_API_KEY';

const searchApi = SearchApi(API_KEY);

const query = {
  queryString: 'symbols:NFLX AND publishedAt:[2020-02-01 TO 2020-05-20]',
  from: 0,
  size: 10,
};

searchApi.getNews(query).then((articles) => console.log(articles));

const streamApi = StreamApi(API_KEY);

streamApi.on('open', () => console.log('Connection open'));
streamApi.on('close', () => console.log('Connection closed'));
streamApi.on('error', (err) => console.log('Connection error ' + err));
streamApi.on('articles', (articles) => console.log(articles[0].title));
