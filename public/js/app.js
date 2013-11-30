var app = (function(){

    var properties = {
        groupId: 1
    };

    return {
        set: function(key, value) {
            properties[key] = value;
        },
        get: function(key) {
            return properties[key];
        }
    }

})();

var chat = (function(){

    var $container,
        $msgInput;

    var newMsg = function(data) {
            var $msg = $container.find('.msg-tpl').clone(true, true);

            $msg.find('.msg-username').html(data.from);
            $msg.find('.msg-content').html(data.text);
            $msg.find('.msg-date').html(data.time);
            $msg.removeClass('msg-tpl');

            return $msg;
        },
        scrollBottom = function() {
            $container.stop().animate({ scrollTop: $container.get(0).scrollHeight }, 400);
        };

    return {
        init: function() {
            $container = $('#chat ul.messages');
            $msgInput = $('#chat textarea');
            $msgInput.keydown(function(e) {
                if (e.which == 13) {
                    e.preventDefault();
                    chat.msgOut();
                }
            });
        },
        msgIn: function(data) {
            var $msg = newMsg(data);
            $container.append($msg);
            console.log($msgInput.height());
            scrollBottom();
        },
        msgOut: function() {
            var text = $msgInput.val();
            if(!text || text == '') return false;
            $msgInput.val('');
            socket.json.send({text: text, groupId: app.get('groupId')});
        }
    };

})();


/*** EVENTS ***/

window.onload = function() {
    // Create a connection to server.
    app.socket = io.connect(location.href);
    app.socket.on('connected', function (data) {
        console.log(data);

        /* init connetion to picture page */
        app.socket.emit('groupIn', { groupId: app.get('groupId') });

        /* handle connection to picture page, response from server */
        app.socket.on('groupInResp', function(data) {
            console.log(data);
            chat.init();
        });

        app.socket.on('message', function (data) {
            console.log(data);
            chat.msgIn(data);
        });
    });
};

window.onbeforeunload = function (evt) {
    /* Before close the page disconnect the socket */
    app.socket.disconnect();
}





