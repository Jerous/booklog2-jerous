var express = require('express');
var router = express.Router();
var events = require('events'); 

//paypal sdk include
var paypal_api = require('paypal-rest-sdk');

//https://github.com/paypal/PayPal-node-SDK
var config_opts = {
    'host': 'api.sandbox.paypal.com',
    'port': '',
    'client_id': 'Af3UwxA9fs4rfavcKDHjaNXGGaLo6lS66OjNwduAJxBbu18A5jRk-tDRR3vO',
    'client_secret': 'EIZFVRDtHCJILqaVN6-mOA3D1-RhTyjjjWRsnx_bItL_ZPLLlixLRDJ3-oSW'
};

router.put('/1/post/:postId/pay', function(req, res, next) {   //更模組化的寫法
    var workflow = new events.EventEmitter();
    var postId = req.params.postId;
    var posts = req.app.db.model.Post;
    
    workflow.outcome = {
        success: false
    };
    
    workflow.on('validate', function(){
        workflow.emit('createPayment');
    });
    
    workflow.on('createPayment', function() {
        paypal_api.configure(config_opts);  //讀入paypal參數
        
        //參考doc 設定必填內容
        //https://developer.paypal.com/webapps/developer/docs/api/#create-a-payment
        var create_payment_json = {
            intent: "sale",
            payer: {
                "payment_method": "paypal"
            },
            transactions: [{
                amount: {
                    currency: 'TWD',
                    total: 128
                },
                description: '購買教學文章'
            }],
            redirect_urls: {
                return_url: 'http://localhost:3000/1/post/' + postId + '/paid',
                cancel_url: 'http://localhost:3000/1/post/' + postId + '/cancel'
            }
        };
        
        paypal_api.payment.create(create_payment_json, function(error, payment){
            if (error) {
                console.log(error);
            } 
            
            if (payment) {
                console.log("Create Payment Response");
                console.log(payment);
            }
        });
    });
    
    workflow.on('response',function(){
    });
    
    return workflow.emit('validate');
    
});

module.exports = router;