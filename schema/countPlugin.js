//schema plugin
// �Ѧ� http://mongoosejs.com/docs/plugins.html
//function ��W�٦ۦ�w�q  ���[�ѼƤ]�ۦ�w�q
module.exports = exports = function countPlugin (schema) {
//schema�ѼƤ���statics�A�b�䤤�A�w�q�@��count�ݩ�  �\��p�U
    schema.statics.count = function(content) {
        var ccc = require('cccount');
        
        return wcharCount(content);
    };
}
