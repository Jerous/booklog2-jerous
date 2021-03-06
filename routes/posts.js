// include事件  
//參考http://nodejs.org/api/events.html#events_class_events_eventemitter
var events = require('events');
var async = require('async');

exports.list = function(req, res){   // express預設一定有request & response函數
    var workflow = new events.EventEmitter();
    var model = req.app.db.model.Post;

    //model
        /*.find({})
        //.populate('userId', 'displayName') 
        .populate('userId') // 要用schema中定義的key
        .exec(function(err, posts) {  //exec表示以上條件成功後執行後面Funtion
            res.send({
                posts: posts
            });
            res.end();
        });*/
        
        //以下為硬幹骯髒寫法  只取需要的內容
        /*.find({})
        .populate('userId')
        .exec(function(err, posts) { 
            var data = [];
            
            posts.forEach(function (post){
                data.push({
                    _id: post._id,
                    displayName: post.userId.displayName,
                    title: post.title,
                    content: post.content
                });
            });
      
            res.send({
                posts: data
            });
            res.end();
        });*/
        
        //改用aggregate project去掉不要的欄位
        /*.aggregate([
            {
                $project: { 
                    _id : 1, 
                    userId : 1, 
                    title : 1, 
                    content : 1,
                    orders : 1,
                    customers : 1,
                    timeCreated : 1
                }
            }
        ])
        .exec(function(err, posts) {
            //http://mongoosejs.com/docs/api.html#query_Query-populate
            //http://mongoosejs.com/docs/api.html#model_Model.populate
            model.populate(posts, {path: 'userId'}, function(err, posts) {
                
                //透過schema plugin再postSchema中新增一個key為wchars，目的為計算中文字數  對照app.js的54行  方法則對照schema/countPlugin.js
                //暴力作法
                for ( i = 0; i < posts.length ; i++) {
                    posts[i].wchars = model.count(posts[i].content);
                    
                    //加上判斷是否paypal已購買的迴圈檢查
                    var uid;
                    for (j = 0; j < posts[i].customers.length; j++) {
                        uid = '' + posts[i].customers[j];
                        if (uid === req.user._id) posts[i].granted = true;
                    }
                }

                res.send({
                    posts: posts
                });
                res.end();
            });
        });*/
    
    //重構post.js 使用workflow FSM
    workflow.outcome = {
        success: false,
        errfor: {}
    };
    
    workflow.on('validation',function(){
        if (model) {
            return workflow.emit('aggregation');
        } else {
            workflow.outcome.errfor = { error_description: 'their is no model' };
            return workflow.emit('response');
        }
    });
    
    workflow.on('aggregation',function(){
        model.aggregate([
            {
                $project: { 
                    _id : 1, 
                    userId : 1, 
                    title : 1, 
                    content : 1,
                    orders : 1,
                    customers : 1,
                    videoid : 1,
                    granted : 1,
                    timeCreated : 1
                }
            }
        ])
        .exec(function(err, posts) {
            if (err) {
                workflow.outcome.errfor = { error_description: 'aggregation fail' };
                return workflow.emit('response');
            }
        
            workflow.posts = posts;   //把posts傳遞到workflow皆可用的全域變數
            //workflow.emit('populate');
            
            //populate狀態再拆解  並用async改寫  同步執行populate wchars isGranted
            //https://github.com/caolan/async
            async.parallel([wchars, isgranted, populate], asyncFinally);
        });
    });
    
    /*workflow.on('populate',function(){
        model.populate(workflow.posts, {path: 'userId'}, function(err, posts) {
            if (err) {
                workflow.outcome.errfor = { error_description: 'populate fail' };
                return workflow.emit('response');
            }
            
            for ( i = 0; i < posts.length ; i++) {
                posts[i].wchars = model.count(posts[i].content);

                var uid;
                for (j = 0; j < posts[i].customers.length; j++) {
                    uid = '' + posts[i].customers[j];
                    if (uid === req.user._id) posts[i].granted = true;
                }
            }
            
            workflow.outcome.posts = posts;
            workflow.outcome.success = true;
            return workflow.emit('response');
        });
    });*/
    
    
    //https://github.com/caolan/async#parallel  
    // function(callback){ callback(err, result)} ;
    
    var populate = function(callback) {
        model.populate(workflow.posts, {path: 'userId'}, function(err, posts) {
            if (err) {
                callback(err, null);
            }
            workflow.outcome.posts = posts;
            
            return callback(null, 'done');
        });
    }
    
    var wchars = function(callback){
        for ( i = 0; i < workflow.posts.length ; i++) {
            workflow.posts[i].wchars = model.count(workflow.posts[i].content);
        }
        return callback(null, 'done');
    }
    
    var isgranted = function(callback){
        for ( i = 0; i < workflow.posts.length ; i++) {
            var uid;
            for (j = 0; j < workflow.posts[i].customers.length; j++) {
                uid = '' + workflow.posts[i].customers[j];
                if (uid === req.user._id) workflow.posts[i].granted = true;
            }
        }
        return callback(null, 'done');
    }
    
    var asyncFinally = function (err, results){
        workflow.outcome.success = true;
        return workflow.emit('response');
    }
    
    workflow.on('response',function(){
        res.send(workflow.outcome);
    });
    
    return workflow.emit('validation');
};

exports.create = function(req, res){
    var workflow = new events.EventEmitter();  //建立狀態機物件
    var model = req.app.db.model.Post;
    
    //因為rest console 網址列傳送參數所以用query
    //var title = req.query.title;  
    //var content = req.query.content;
    // backbone傳遞參數用body  
    var title = req.body.title;
    var content = req.body.content;
    var videoid = req.body.videoid;
    
    //從passportjs生成的req.user中撈id
    //參考app.js中的104行 return done(null, user); 
    var userId = req.user._id;  
    
    console.log(req.user);
    
    //配合front-end使用的狀態回饋訊息
    //backbone中預設有succee與errfor兩種key
    workflow.outcome = {
        success: false,
        errfor: {}
    };
    
    workflow.on('validation',function(){    //設立一個狀態 validation
        
        if (title.length === 0)
            workflow.outcome.errfor.title = '這是一個必填欄位';
            
        if (content.length === 0)
            workflow.outcome.errfor.content = '這是一個必填欄位';
            
        if (videoid.length === 0)
            workflow.outcome.errfor.videoid = '這是一個必填欄位';

        if (Object.keys(workflow.outcome.errfor).length !== 0)
            return workflow.emit('response');
   
        workflow.emit('savePost');  //跳到另一個狀態
    });
    
    workflow.on('savePost',function(){
        var post = new model({
            userId : userId,
            title : title,
            content : content,
            videoid : videoid,
            granted : false
        });
        post.save();
        
        workflow.outcome.success = true;
        
        workflow.emit('response');
    });
    
    workflow.on('response',function(){
        res.send(workflow.outcome);
    });
    
    return workflow.emit('validation');
};

exports.listByTag = function(req, res){
    var workflow = new events.EventEmitter();
    var model = req.app.db.model.Post;
    var tag = req.params.tag;
    
    workflow.outcome = {
        success: false,
        errfor: {}
    };
    
    workflow.on('find',function(){
        model
          //.find({ title: tag })
          .find( { $text: { $search: tag } })
          .exec(function(err, posts) {  
              /*res.send({
                  posts: posts
              });
              res.end();*/
              if (err) {
                    workflow.outcome.errfor = { error_description: 'find fail' };
                    return workflow.emit('response');
                }
            
                workflow.posts = posts;
                async.parallel([wchars, isgranted, populate], asyncFinally);
          });
    
    });
    
      
    var populate = function(callback) {
      model.populate(workflow.posts, {path: 'userId'}, function(err, posts) {
          if (err) {
              callback(err, null);
              throw lk
          }
          workflow.outcome.posts = posts;
          
          return callback(null, 'done');
      });
    }
    
    var wchars = function(callback){
        for ( i = 0; i < workflow.posts.length ; i++) {
            workflow.posts[i].wchars = model.count(workflow.posts[i].content);
        }
        return callback(null, 'done');
    }
    
    var isgranted = function(callback){
        for ( i = 0; i < workflow.posts.length ; i++) {
            var uid;
            for (j = 0; j < workflow.posts[i].customers.length; j++) {
                uid = '' + workflow.posts[i].customers[j];
                if (uid === req.user._id) workflow.posts[i].granted = true;
            }
        }
        return callback(null, 'done');
    }
    
    var asyncFinally = function (err, results){
        workflow.outcome.success = true;
        return workflow.emit('response');
    }
    
    workflow.on('response',function(){
        res.send(workflow.outcome);
    });
    
    return workflow.emit('find');
};
