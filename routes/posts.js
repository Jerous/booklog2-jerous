
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
    var model = req.app.db.model.Post;
    var title = req.query.title;
    var content = req.query.content;
    
    var post = new model({
        title : title,
        content : content
    });
    post.save();
    
    res.send({ status:'post ok'});

};