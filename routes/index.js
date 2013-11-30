var auth = require('../auth.js');

/**
 * All the routes includes here
 **/

module.exports = function(app) {

    var main = require('./main'),
        sign = require('./sign'),
        admin = require('./admin');

    app.get('/', main.index);
    app.get('/signin', sign.in);
    app.get('/signup', sign.up);
}