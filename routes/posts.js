// include事件  
//參考http://nodejs.org/api/events.html#events_class_events_eventemitter
var events = require('events'); 

exports.list = function(req, res){   // express預設一定有request & response函數
    var model = req.app.db.model.Post;

    model
      .find({})
      .exec(function(err, posts) {  //exec表示以上條件成功後執行後面Funtion
          res.send({
              posts: posts
          });
          res.end();
      });
};

exports.create = function(req, res){
    var workflow = new events.EventEmitter();  //建立狀態機物件
    var model = req.app.db.model.Post;
    var title = req.query.title;
    var content = req.query.content;
    
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