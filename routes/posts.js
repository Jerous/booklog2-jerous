var post = 
[{
    "title": "您好",
    "content": "今天是星期天"
},
{
    "title": "Hello",
    "content": "Today is sunday"
}];


exports.list = function(req, res){   // express預設一定有request & response函數
    res.send(post);
};

exports.create = function(req, res){
};