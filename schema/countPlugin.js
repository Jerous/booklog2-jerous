//schema plugin
// 把σ http://mongoosejs.com/docs/plugins.html
//function 嘿︽﹚竡  ず瞇把计︽﹚竡
module.exports = exports = function countPlugin (schema) {
//schema把计いstaticsㄤい﹚竡count妮┦  
    schema.statics.count = function(content) {
        var ccc = require('cccount');
        
        return wcharCount(content);
    };
}
