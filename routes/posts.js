var post = 
[{
    "title": "�z�n",
    "content": "���ѬO�P����"
},
{
    "title": "Hello",
    "content": "Today is sunday"
}];


exports.list = function(req, res){   // express�w�]�@�w��request & response���
    res.send(post);
};

exports.create = function(req, res){
};