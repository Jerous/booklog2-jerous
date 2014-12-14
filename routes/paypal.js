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
            
                //http://localhost:3000/1/post/548bd9bacb50ac8018d15bf4/paid?paymentId=PAY-3YH39679C3452362HKSF5VRA&token=EC-4YM71232SL814491D&PayerID=D89BU7L8CYYP6
                return_url: 'http://localhost:3000/1/post/' + postId + '/paid',
                cancel_url: 'http://localhost:3000/1/post/' + postId + '/cancel'
            }
        };
        //參考doc 設定必填內容
        paypal_api.payment.create(create_payment_json, function(error, payment){
            if (error) {
                console.log(error);
                return workflow.emit('response');
            } 

            /*if (payment) {
                console.log("Create Payment Response");
                console.log(payment);
            }
            
            var order = {
		    	userId: req.user._id,
		    	paypal: payment
		    };

			posts
			.findByIdAndUpdate(postId, { $addToSet: { orders: order } }, function(err, post) {
				workflow.outcome.success = true;
				workflow.outcome.data = post;
				
				workflow.emit('response');
			});*/
            
            if (!payment) {
                return workflow.emit('response');
            }
            
            workflow.payment = payment;
            workflow.emit('updatePost');
        });
    });
    
    workflow.on('updatePost',function(){
    
        // 定義購買資料中要存購買人與購買人的PAYPAL所有資訊
        var order = {
			userId: req.user._id,
			paypal: workflow.payment
		};
        
        //mongoose findByIdAndUpdate http://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
        //mongodb addToSet http://docs.mongodb.org/manual/reference/operator/update/addToSet/
		posts
		.findByIdAndUpdate(postId, { $addToSet: { orders: order } }, function(err, post) {
			workflow.outcome.success = true;
			workflow.outcome.data = post;
			
			workflow.emit('response');
		});
    });
    
    workflow.on('response',function(){
        return res.send(workflow.outcome);
    });
    
    return workflow.emit('validate');
    
});

router.get('/1/post/:postId/paid', function(req, res, next) {   //更模組化的寫法
    var workflow = new events.EventEmitter();
    var PayerID = req.query.PayerID;   // paypal callback query string  付款人資訊
    //var paymentId = req.query.paymentId
    var postId = req.params.postId;
    var posts = req.app.db.model.Post;
    
    workflow.outcome = {
        success: false
    };
    
    // 先驗證要購買的文章是否存在  存在就把購買人的id存入paymentId
    workflow.on('validate',function(){
        posts
        .findOne( {_id: postId} )
        .exec(function(err, post){
            if (err) {
                workflow.outcome.data = { error_description: err };
                return workflow.emit('response');
            }
            //產品不存在
            if (!post) {
                workflow.outcome.data = { error_description: 'product not exist' };
                return workflow.emit('response');
            }
            
            //workflow.paymentId = paymentId;  //搭配117行
            workflow.paymentId = post.orders[0].paypal.id;
            workflow.emit('execute_payment');
        });
    });
    
    workflow.on('execute_payment',function(){
        paypal_api.configure(config_opts);  //讀入paypal參數
        
        //https://developer.paypal.com/docs/api/#execute-an-approved-paypal-payment
        //payer_id為必須
        var execute_payment_details = { 
            payer_id: PayerID
        };
        
        //由doc的request sample code得知寫法
        paypal_api.payment.execute(workflow.paymentId, execute_payment_details, function(error, payment){
            if(error){
                workflow.err = err;
                return workflow.emit('response');
            }
            
            workflow.outcome.data = payment; // 付款人資料存入outcome.data
			workflow.emit('updatePost');   
        });
    });
    
    workflow.on('updatePost',function(){
		posts
		.findByIdAndUpdate(postId, { $addToSet: { customers: req.user._id } }, function(err, post) {
			workflow.outcome.success = true;
			workflow.emit('response');
		});
    });
    
    
    workflow.on('response',function(){
        return res.send(workflow.outcome);
    });
    
    return workflow.emit('validate');
});

module.exports = router;