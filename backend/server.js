const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


// import API routes
// const routes = require('./Routes/routes');
const auth = require('./Routes/auth');
const database = require('./Routes/database');

const { User } = require('./models/models');
const hashPassword = require('./helper/passwordHash');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//passport setup
app.use(session({
  secret: process.env.SECRET,
  cookie: {
    // In milliseconds, i.e., five minutes
    maxAge: 1000 * 60 * 5
  },
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});


passport.use(new LocalStrategy( (username, password, done) => {
  const hash = hashPassword(password);

  // Find the user with the given username
  User.findOne({username: username})
    .then((user) => {
      // if no user present, auth failed
      if (!user) {
        console.log(user);
        return done(null, false, {message: 'Incorrect username.'});
      }
      // if passwords do not match, auth failed
      if (user.password !== hash) {
        return done(null, false, {message: 'Incorrect password.'});
      }
      // auth has has succeeded
      return done(null, user);
    })
    .catch((err) => {
      console.log(err);
      return done(err);
    });
}));


app.use('/', auth(passport));
// app.use('/', routes);
app.use('/', database);

app.listen(3000, function () {
  console.log('Backend server for Electron App running on port 3000!');
});
