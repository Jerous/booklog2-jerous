var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');  //啟動Server的http

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

//定義express中的資料庫物件好存取
app.db = {
	model: {
		Post: mongoose.model('post', postSchema)   //注意mongodb中的collection name和mongoose引用要少一個s
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

app.use('/', routes);
app.use('/users', users);

//新增middleware  可用來判斷是否登入才讀取頁面等功能
app.get('/1/post', function(req, res, next){
    console.log('this is a express middleware');
    next();
});
//1123 class morning add (express middleware的關係  改到這裡才會work  不然會先跳404)
app.get('/1/post', posts.list);
app.post('/1/post', posts.create);

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
