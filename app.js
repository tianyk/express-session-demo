var FileStreamRotator = require('file-stream-rotator');
var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var config = require('./config');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('trust proxy', true);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var redis = require('./lib/redis');
var rc = redis.getRedisClient(config.redis);
var RedisStore = require('connect-redis')(session);
app.use(session({
    secret: 'keyboard cat',
    resave: false, // 每次是否重新保存一遍session
    saveUninitialized: false, // 是否保存未初始化的session
    unset: 'destroy', // 销毁处理方案
    // store: new MongoStore({
    //     url: 'mongodb://localhost/test-app',
    //     collection: 'sessionInfos', // 集合名称
    //     ttl: 5 * 60 // 过期时间
    // })
    store: new RedisStore({
        client: rc,
        ttl: 5 * 60 // 过期时间
    })
}));

// HTTP日志
var logDirectory = __dirname + '/logs';
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
var accessLogStream = FileStreamRotator.getStream({
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false, // 开发模式下打开
    date_format: "YYYY-MM-DD"
});
app.use(logger('combined', {
    stream: accessLogStream
}));
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
