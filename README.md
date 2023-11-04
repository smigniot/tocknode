# Tock server

A tock server in nodejs, using [Express 4](http://expressjs.com/).

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

## Running on docker

```
$ docker run -p 127.0.0.1:5000:5000/tcp smigniot/tocknode:v1.0.1
```

