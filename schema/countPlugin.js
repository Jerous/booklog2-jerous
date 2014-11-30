//schema plugin
//參考 http://mongoosejs.com/docs/plugins.html
//function後名稱自行定義
module.exports = exports = function countPlugin (schema) {
//schema內的statics屬性中再新增一個count方法 功能如下
    schema.statics.count = function(content) {
        var ccc = require('cccount');
        
        return wcharCount(content);
    };
}
