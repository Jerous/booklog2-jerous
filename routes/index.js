var express = require('express');
var router = express.Router();

/*要進入首頁要先FB登入*/
router.get('/', function(req, res, next) {
    //reference http://stackoverflow.com/questions/14188834
	if (req.isAuthenticated()) {  
		next();
	} else {
		res.redirect('/login');
	}
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
