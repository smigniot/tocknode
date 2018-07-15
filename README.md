# Tock server

A tock server in nodejs, using [Express 4](http://expressjs.com/), ready to
be deployed on [Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs).

* Allow multiple games, and a replay mode
* Name a player *Yoshi* to make it a computer opponent

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ cd tocknode
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
$ heroku create
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

