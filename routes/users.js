var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
    if (req.session) {
        req.session.now = Date.now();
        res.send('Now: ' + (req.session.now || '-:-:-'));
    } else {
        res.send('respond with a resource');
    }
});

module.exports = router;
