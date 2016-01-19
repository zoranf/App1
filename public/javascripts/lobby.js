$(document).ready(function() {

    if ($.cookie('username') == null )
        $.cookie('username', "Guest"+Math.round(Math.random()*10000));
    var url = $(location).attr('href');
    var g_id = url.split("/")[4];
    var r_user = $.cookie("username");
    
    var socket = io.connect();

    var type = '';
    /*if(g_id == "Schnapssen")
        type = '<select id="play_type"><option value="2p">2p</option><option value="3p">3p</option><option value="4p">4p</option></select>'; 
    if(g_id == "Fourinarow")
        type = '<select id="play_type"><option value="6x6">6x6</option><option value="7x7">7x7</option><option value="8x8">8x8</option></select>'; 
*/
    $('#game_type').append(type);

    socket.on('connect', function() {
        
        socket.emit('send_rooms', { g_id: g_id});
        //socket.emit('send_auth' {username: r_user, password: "a"});
    });
    
    /*socket.on('get_session_id' function(data){

        $.cookie("session_id", data);
    });*/

    socket.on('update_rooms', function(data) {
           
        rooms = data.rooms;
        $("#rooms").empty();
        for(a = 0; a < rooms.length; a++){

            $('#list').append('<li><a href="/lobby/'+g_id+'/room/'+rooms[a].r_index+'/type/'+rooms[a].r_type+'"><div class="ID">'+(a+1)+'</div><div class="password"><img src="/images/lock-white.png" width="11" height="13" /></div><div class="room-name">'+rooms[a].r_name+'</div><div class="game-mode">'+rooms[a].r_type+'</div><div class="host">'+rooms[a].r_creator+'</div><div class="players">'+rooms[a].vacancy+'/'+rooms[a].max_p+'</div></a></li>');
        }
    });
    
    /*$('#create-room').click(function() {
        
        r_name = "aa";
        r_pass = "aa";
        r_type = "3p";
        
        socket.emit('create_room', { 
            r_name: r_name, 
            r_pass: r_pass, 
            r_creator: r_user, 
            r_type: r_type,
            g_id: g_id
        });
    });*/

    socket.on('goto_room', function(data) {

        window.location.href="/lobby/" + g_id + "/room/" + data.r_id + "/type/" + data.r_type;
    });

    socket.on('goto_lobby', function() {

        window.location.href="/lobby/" + g_id;
    });
});
