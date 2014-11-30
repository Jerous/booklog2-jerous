// include事件  
//參考http://nodejs.org/api/events.html#events_class_events_eventemitter
var events = require('events'); 

exports.list = function(req, res){   // express預設一定有request & response函數
    var model = req.app.db.model.Post;

    model
        /*.find({})
        //.populate('userId', 'displayName') 
        .populate('userId') // 要用schema中定義的key
        .exec(function(err, posts) {  //exec表示以上條件成功後執行後面Funtion
            res.send({
                posts: posts
            });
            res.end();
        });*/
        
        //改用aggregate project去掉不要的欄位
        .aggregate([
            {
                $project: { 
                    _id : 1, 
                    userId : 1, 
                    title : 1, 
                    content : 1
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
                }
                
                res.send({
                    posts: posts
                });
                res.end();
            });
        });
        
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

        if (Object.keys(workflow.outcome.errfor).length !== 0)
            return workflow.emit('response');
   
        workflow.emit('savePost');  //跳到另一個狀態
    });
    
    workflow.on('savePost',function(){
        var post = new model({
            userId : userId,
            title : title,
            content : content
        });
        post.save();
        
        workflow.outcome.success = true;
        
        workflow.emit('response');
    });
    
    workflow.on('response',function(){
        res.send(workflow.outcome);
    });
    
    workflow.emit('validation');
};

exports.listByTag = function(req, res){
    var model = req.app.db.model.Post;
    var tag = req.params.tag;

    model
      //.find({ title: tag })
      .find( { $text: { $search: tag } })
      .exec(function(err, posts) {  
          res.send({
              posts: posts
          });
          res.end();
      });
};
