var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');  //啟動Server的http
var passport = require('passport'), FacebookStrategy = require('passport-facebook').Strategy ;  //passport facebook login
var session = require('express-session'); //使用session

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');  //1123 class morning add

var app = express();

//引入mongoose  並設定資料庫位置名稱
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/booklog2');

//show mongoose連接訊息
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('MongoDB: connected.');	
});

// 定義資料庫schema
var postSchema = new mongoose.Schema({
    title: String,
    content: String
});

var userSchema = new mongoose.Schema({
    username: {type: String, unique: true },
    displayName: {type: String, unique: true },
    email: {type: String, unique: true },
    timeCreated: {type: Date, default: Date.now },
    facebook: {}
});


//定義express中的資料庫物件好存取
app.db = {
	model: {
		Post: mongoose.model('post', postSchema),        //注意mongodb中的collection name和mongoose引用要少一個s
        User: mongoose.model('user', userSchema)
    }
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport facebook login use
app.use(session({ secret: 'booklog2-jerous' }));
app.use(passport.initialize());   //會跳錯  根據/guide/configure/新增
app.use(passport.session());   //會跳錯  根據/guide/configure/新增

//Sessions (optional)
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
        clientID: '558384574291566',
        clientSecret: '6ab75ab8c84558bba463699205f96df3',
        callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        //return done(null, profile);
        //實作寫入資料庫
        app.db.model.User.findOne({"facebook._json.id": profile._json.id}, function(err, user) {
            if (!user) {
                var obj = {
                    username: profile.username,
                    displayName: profile.displayName,
                    email: '',
                    facebook: profile
                };
    
            var doc = new app.db.model.User(obj);
            doc.save();
    
            user = doc;
            }
    
            return done(null, user); 
        });
    }
));

app.use('/', routes);
app.use('/users', users);

//另一種middleware寫法
//app.get('/1/post', function(req, res, next){
//    console.log('this is a express middleware');
//    next();
//}, posts.list);
//新增middleware  可用來判斷是否登入才讀取頁面等功能
app.get('/1/post', function(req, res, next){
    console.log('this is a express middleware');
    next();
});
//1123 class morning add (express middleware的關係  改到這裡才會work  不然會先跳404)
app.get('/1/post', posts.list);
app.post('/1/post', posts.create);


//FB login
app.get('/login', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { 
        successRedirect: '/',
        failureRedirect: '/login/failmessage/' 
    })
);
  
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

//啟動Server的http並設定port
http.createServer(app).listen(3000, function(){
    console.log('Express server lisening on port 3000');
});

module.exports = app;
