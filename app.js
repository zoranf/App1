var express = require('express'),
    url = "mongodb://nodejitsu_zoranf:s622he159nr7g8isgjke2i1ght@ds051947.mongolab.com:51947/nodejitsu_zoranf_nodejitsudb8036041315",
    coll = ['users', 'games'],
    db = require('mongojs').connect(url, coll)
    http = require('http'),
    path = require('path');
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

app.configure("production", function() {

    var oneYear = 31557600000;
    app.set("port", process.env.PORT || 3000);
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.favicon(__dirname + "/public/images/favicon.ico"));
    app.use(express.logger("dev"));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.locals();
    app.use(app.router);
    app.use(express.static(path.join(__dirname, "public"), { maxAge: oneYear }));
});

// Checks for user cookie
function isLoggedIn(req, res) {

    if (req.cookies.username)
        return true;
    else
        return false;
}

// User model object
function user(username, password, nickname) {

    this.username = username;
    this.password = password;
    this.nickname = nickname;
}

// GET
// Index
app.get('/*', function(req, res, next) {

    
    if (isLoggedIn(req, res))
        res.locals.signin = true;
    else
        res.locals.signin = false;

    next();
});

app.get('/', function(req, res) {

    db.games.find(function(err, docs) {

        res.render('index', {
            title: 'Home',
            games: docs
        });
    });
});

// Lobby
app.get('/lobby/:g_id', function(req, res) {

    g_id = req.params.g_id;
    if(!game_exists(g_id)) {

        return res.render('404', {
            title: 'Game not found',
            message: 'Game ' + req.params.id + 'not found'
        });
    }
    
    return res.render('lobby', { title: 'Lobby', name: req.params.id });
});

// Lobby
app.get('/lobby/:g_id/room/:r_id/type/:r_type', function(req, res) {

    g_id = req.params.g_id;
    r_id = req.params.r_id;
    r_type = req.params.r_type;


    if (get_room_type(g_id, r_id, r_type) == r_type){

        if(rooms[g_id][r_id].vacancy < get_max_p(g_id, r_id))
            return res.render('games/'+g_id+r_type, { title: 'Schnapsen'});
        else{

            return res.render('404', {
                title: 'Room full',
                message: 'Room ' + r_id+ ' full'
            });
        }
    }
    
    return res.render('404', {
        title: 'Room not found',
        message: 'Room ' + r_id + ' not found'
    });
});

// Sign out
app.get('/logout', function(req, res) {
 
    res.clearCookie('username');
    res.redirect('/');
});

// Profile
app.get('/profile', function(req, res) {
 
    if (isLoggedIn(req, res)) {
 
        db.games.find(function(err, docs) {
 
            db.users.find( { username : req.cookies.user }, function(err2, docs2) {

                res.render("profile", {
                    title: "Profile"
                });
            });
        });
    }
});
 
//////////////////
// AJAX PROFILE //
//////////////////
app.post('/profile_edit', function(req, res) {
 
    // Change username, nickname
    if(req.body.new_password == "New password") {
 
        db.users.update({ username: req.cookies.user }, { $set: {username: req.body.username, nickname: req.body.nickname }});
        res.cookie('username', req.body.username);
        // Output Profile again
        if (isLoggedIn(req, res)) {
 
            db.games.find(function(err, docs) {
 
                db.users.find( { username : req.body.username }, function(err2, docs2) {
 
                    res.send("SUCCESS");
                });
            });
        } else {
 
            res.send("NOT LOGGED IN");
        }
    } else {
 
        // Change username, nickname, password
        db.users.find({ username: req.cookies.user, password: req.body.password_md5}).count(function(err, count) {
 
            // Check if good old password
            if(count==1) {
             
                db.users.update({ username: req.cookies.user }, { $set: {username: req.body.username, nickname: req.body.nickname, password: req.body.new_password_md5 }});
                res.cookie('username', req.body.username);
 
                // Output Profile again
                if (isLoggedIn(req, res)) {
 
                    db.games.find(function(err, docs) {
 
                        db.users.find( { username : req.body.username }, function(err2, docs2) {
 
                            res.send("SUCCESS");
                        });
                    });
                } else {
 
                    res.send("NOT LOGGED IN");
                }
            } else {
 
                // Output Profile again
                if (isLoggedIn(req, res)) {
 
                    db.games.find(function(err, docs) {
 
                        db.users.find( { username : req.cookies.user }, function(err2, docs2) {
                            // wrong user password
                            res.send("ERROR");
                        });
                    });
                } else {
 
                    res.send("NOT LOGGED IN");
                }
            }
        });
 
    }
});
 
// POST
// Login
app.post('/login', function(req, res) {

    db.users.findOne({username:req.body.login_username, password:req.body.login_password_md5}, function(err, doc) {

        if (err) {
            return console.log(err);
        }
 
        if (doc != null) {
 
            res.cookie('username', req.body.login_username);
            return res.redirect('/');
        } else {
 
            return res.redirect('/');
        }
    });
});
 
// Register
app.post('/register', function(req, res){
    
    var stats = {
        "played": "0",
        "wins": "0",
        "lost": "0",
        "schnapssen": {
            "wins": "0",
            "lost": "0",
            "played": "0"
        },
        "fourinarow": {
            "wins": "0",
            "lost": "0",
            "played": "0"
        },
        "uno": {
            "wins": "0",
            "lost": "0",
            "played": "0"
        }
    };
 
    var uporabnik = new user(req.body.reg_username, req.body.reg_password_md5, req.body.reg_nickname, stats);
 
    db.users.save(uporabnik, function(err, saved_user) {
 
        if (err || !saved_user) {
 
            return res.render('user', {
                title: 'Error',
                msg: 'Napaka pri registraciji! Uporabnik že obstaja!'
            });
        } else {
 
            return res.render('user', {
                title: 'Success',
                msg: 'Uspešno ste se registrirali!'
            });
        }
    });
});

///////////////////////////
// error //
///////////////////////////
 
// 404 File not found
app.use(function(req, res, next) {
 
    res.status(404);
    res.render('404', {
        title: '404 File not found',
        message: '404 File not found'
    });
});
 
// 500 Internal server error
app.use(function(err, req, res, next) {
 
    res.status(500);
    res.render('500', {
        title: '500 Internal server error',
        message: '500 Internal server error'
    });
});
 
server.listen(app.get('port'), function() { console.log("Express server listening on port " + app.get('port')); });

///////////////////////////
// functions //
///////////////////////////

function game_exists(g_id){

    if(game_check[g_id] != undefined)
        return true;

    return false;
}

function game_type_exists(g_id, r_type){

    if(game_exists(g_id) && game_check[g_id][r_type] != undefined)
        return true;

    return false;
}

function get_room_type(g_id, r_id, r_type){

    if(room_exists(g_id, r_id) && game_type_exists(g_id, r_type))
        return rooms[g_id][r_id].r_type;

    return undefined;
}

function room_exists(g_id, r_id){

    if(game_exists(g_id) && rooms[g_id][r_id] != undefined)
        return true;

    return false;
}

function get_max_p(g_id, r_id){

    return game_check[g_id][rooms[g_id][r_id].r_type].max_p;
}

function user_auth(user){

    return true;
}

function schnapsen_points(c){

    sum = 0;

    if(c <= 3)
        sum+=c+1;
    else
        sum+=c+6;
    return sum;
}

function schnapsen_has_24(cards, adut){

    c = 0;
    len = cards.length;
    adut_c = "";
    if(adut.length == 2)
        adut_c = adut.split()[0];
    else
        adut_c = adut;
    for(a = 0; a < len; a++){

        if(cards[a].split("")[0] != adut_c)
            c++;
    }
    if(c == 1)
        return true;
    else
        return false;
}
function schnapsen_call(cards){

    len = cards.length;
    can_call = [];

    for(a = 0; a < len; a++)
        can_call[a] = false;

    for(a = 0; a < len; a++)
        if(cards[a].split("")[1] == "2")
            for(b = 0; b < len; b++)
                if(cards[b].split("")[1] == "3" && cards[a].split("")[0] == cards[b].split("")[0])
                    can_call[a] = true;
    return can_call;
}

function schnapsen_switch(cards, adut){

    len = cards.length;
    can_switch = [];
    adut_c = "";
    if(adut.length == 2)
        adut_c = adut.split()[0];
    else
        adut_c = adut;
    for(a = 0; a < len; a++)
        can_switch[a] = false;

    for(a = 0; a < len; a++)
        if(cards[a] == (adut_c+"1"))
            can_switch[a] = true;
    return can_switch;
}

var rooms = [];
var users = [];
var socket_room_pair = [];
var game_check = [];

rooms["schnapsen"] = [];
rooms["schnapsen"]["active"] = []; //here we save all active room ids
rooms["schnapsen"]["counter"] = "0";
game_check["schnapsen"] = [];
game_check["schnapsen"]["2p"] = {max_p: 2, min_p: 2};
game_check["schnapsen"]["3p"] = {max_p: 3, min_p: 3};
game_check["schnapsen"]["4p"] = {max_p: 4, min_p: 4};
/*db.games.find(function(err, docs) { //here we create the array for all existing rooms with all their functions and players from the database

    for( a = 0; a < docs.length; a++){
    
        current = docs[a].name;
        rooms[current] = [];
        rooms[current]["active"] = []; //here we save all active room ids
        rooms[current]["counter"] = "0"; //here we keep the next number to be used when creating a room
        rooms[current]["counter"] = "0"; //here we keep the next number to be used when creating a room
        game_check[current] = [];
        for(b = 0; b<parseInt(docs[a].types);b++){

            game_check[current][docs[a].type[""+b]] = {max_p: docs[a].max_players[""+b], min_p: docs[a].min_players[""+b]};
        }
    }
});

db.users.find(function(err, docs) {//here we create the array for all users from the database

    for( a = 0; a < docs.length; a++){//have to add session id generator and password stuff

        current = docs[a].username;
        users[current] = [];
        //users[current]["pass"] = docs[a].password;
        users[current]["pass"] = "a";
        users[current]["nick"] = docs[a].nickname;
        users[current]["session_id"] = "a";
    }
});*/

io.sockets.on('connection', function(socket) {

    socket.on('connect', function(data){
        
    });

    /*socket.on('send_auth' function(data){

        if(users.indexOf(data.username) != -1 && users[data.username]["pass"] == data.password){ //checks if user actualy exists and if the password is correct

            session_id = "a";
            users[data.username]["session_id"] = session_id;
            socket.emit('get_session_id', session_id);
        }
    });*/
    
    socket.on('disconnect', function(){
        
        if(socket_room_pair[socket.id] != undefined){
        
            r_id = socket_room_pair[socket.id].r_id;
            g_id = socket_room_pair[socket.id].g_id;
            r_user = socket_room_pair[socket.id].r_user;
            if(room_exists(g_id, r_id)){
                
                rooms[g_id][r_id].players.splice(rooms[g_id][r_id].players.indexOf(r_user),1);
                io.sockets.in(g_id+r_id).emit('player_change', {players: rooms[g_id][r_id].players});
                rooms[g_id][r_id].vacancy--;
                if ( rooms[g_id][r_id].ingame || rooms[g_id][r_id].r_creator == r_user){
                    
                    io.sockets.in(g_id+r_id).emit('goto_lobby');
                    delete socket_room_pair[socket.id];
                    delete rooms[g_id][r_id];
                    rooms[g_id]["active"].splice(rooms[g_id]["active"].indexOf(r_id),1);
                }
            }
        }
    });
    
    socket.on('create_room', function(data){
        
        g_id = data.g_id;
        r_type = data.r_type;

        if(user_auth(data.r_creator) && game_type_exists(g_id, r_type)) { //checks if user is authorized and checks if game and game type exists
            
            rooms[g_id]["active"].push(rooms[g_id]["counter"]); //saves the game index in "active" tab
            current = rooms[g_id]["counter"];
            rooms[g_id]["counter"] = "" + (parseInt(rooms[g_id]["counter"]) + 1); //advances index to the next value

            rooms[g_id][current] = {

                r_name      : data.r_name, 
                r_pass      : data.r_pass, 
                r_creator   : data.r_creator, 
                r_type      : data.r_type,
                g_id        : data.g_id,
                p_onturn   : 0, //here we save which player is on turn
                ingame     : false, //here we set a flag if the game is undergoing
                players    : [], //array where players are 
                do_logic   : false, //here we check if the room is currently calculating the current move
                logic      : [], //here we save the game logic
                vacancy    : 0, //players in the room
                next_round : false,
                round : 0
            };

            if(g_id == "Fourinarow"){

                width=parseInt(data.r_type.split("x")[0]);
                height=parseInt(data.r_type.split("x")[1]);

                for(a = 0; a < parseInt(width); a++)
                    rooms[g_id][current].logic[a] = [];
                for(a = 0; a < parseInt(height); a++)
                    for(b = 0; b < parseInt(width); b++)
                        rooms[g_id][current].logic[b][a] = 2;
            }

            socket.emit('goto_room', { r_id: current, r_type: r_type});
        }
    });
    
    socket.on('send_rooms', function(data){
                
        g_id = data.g_id;                      
        if(game_exists(g_id)){
        
            rooms_ess = [];
            counter = 0;
            for(a = 0; a < rooms[g_id]["active"].length; a++){ //makes a array to send to the client with only the essentialy information about the rooms

                aa = rooms[g_id]["active"][a];
                if(rooms[g_id][aa].vacancy < get_max_p(g_id, aa)){

                    pass = "";
                    if(rooms[g_id][aa].r_pass != "")
                        pass = "yes";
                    else
                        pass = "no";

                    rooms_ess[counter] = {

                        r_name     : rooms[g_id][aa].r_name,
                        r_creator  : rooms[g_id][aa].r_creator,
                        r_type     : rooms[g_id][aa].r_type,
                        r_index    : aa,
                        vacancy    : rooms[g_id][aa].vacancy,
                        max_p      : get_max_p(g_id, aa),
                        r_pass     : pass
                    };
                    counter++;
                }
            }

            socket.emit('update_rooms', {rooms: rooms_ess});
        }
    });
    
    socket.on('join_room', function(data){
        
        r_id = data.r_id;
        g_id = data.g_id;
        r_user = data.r_user;
        
        if(user_auth(r_user) && room_exists(g_id, r_id))
        {

            r_type = rooms[g_id][r_id].r_type;
            if(rooms[g_id][r_id].vacancy < get_max_p(g_id, r_id) && !rooms[g_id][r_id].ingame) { //checks if the room has free spots and if the game is already in game
                
                socket.join(g_id+r_id);
                rooms[g_id][r_id].vacancy++;
                socket_room_pair[socket.id] = data;
                rooms[g_id][r_id].players.push(r_user);
                io.sockets.in(g_id+r_id).emit('player_change', {players: rooms[g_id][r_id].players});
            }
        }
    });
    
    socket.on('send_message', function(data) {
        
        msg = data.username + ': ' + data.message;
        io.sockets.in(data.g_id+data.r_id).emit('get_message', msg);
    });
    
    socket.on('send_move', function(data) {

        r_id = data.r_id;
        g_id = data.g_id;
        r_user = data.r_user;
        turn = data.turn;
        action = data.action;
        
        if(user_auth(r_user) && room_exists(g_id, r_id) && rooms[g_id][r_id].players[rooms[g_id][r_id].p_onturn] == r_user && !rooms[g_id][r_id].do_logic){

            rooms[g_id][r_id].do_logic = true;
            p_onturn = rooms[g_id][r_id].p_onturn;
            valid_move = true;
            logic = rooms[g_id][r_id].logic;
            players = rooms[g_id][r_id].players;
            win = false;
            p_win = "";
            send_points = false;

            if(g_id == "Fourinarow"){

                width=parseInt(rooms[g_id][r_id].r_type.split("x")[0]);
                height=parseInt(rooms[g_id][r_id].r_type.split("x")[1]);
                //rooms[g_id][r_id].ingame = true;
                turn_end = false;
                num = 0;

                while(!turn_end){

                    if(logic[turn][num] == 2 ){

                        logic[turn][num] = p_onturn;
                        turn_end = true;
                    } else
                        num++;
                    if(num == height && !turn_end){

                        turn_end = true;
                        valid_move = false;
                    }
                }

                if(valid_move){

                    for(b = 0;b<width-3;b++){

                        if(logic[b][num] == p_onturn && logic[b+1][num] == p_onturn && logic[b+2][num] == p_onturn && logic[b+3][num] == p_onturn){

                            win = true;
                            break;
                        }

                        if(logic[turn][b] == p_onturn && logic[turn][b+1] == p_onturn && logic[turn][b+2] == p_onturn && logic[turn][b+3] == p_onturn){
                            
                            win = true;
                            break;
                        }

                        undef = false;
                        ay = Math.max(0, parseInt(turn)-parseInt(num));
                        ax = Math.max(0, parseInt(num)-parseInt(turn));
                        for(a = 0; a < width-3; a++){

                             if(logic[b+a+ay] == undefined || logic[b+a+ay][b+a+ax] == undefined)
                                undef=true;
                        }

                        if(!undef && logic[b+ay][b+ax] == p_onturn && logic[b+1+ay][b+1+ax] == p_onturn && logic[b+2+ay][b+2+ax] == p_onturn && logic[b+3+ay][b+3+ax] == p_onturn){
                            
                            win = true;
                            break;
                        }

                        undef = false;
                        ax = Math.min(6, parseInt(turn)+parseInt(num));
                        ay = Math.max(0, parseInt(turn) + parseInt(num) - 6);
                        for(a = 0; a < width-3; a++){

                             if(logic[b+a+ay] == undefined || logic[b+a+ay][b-a+ax] == undefined)
                                undef=true;
                        }

                        if(!undef && logic[b+ay][b+ax] == p_onturn && logic[b+1+ay][b-1+ax] == p_onturn && logic[b+2+ay][b-2+ax] == p_onturn && logic[b+3+ay][b-3+ax] == p_onturn){
                            
                            win = true;
                            break;
                        }
                    }
                    rooms[g_id][r_id].g_logic = logic;
                    rooms[g_id][r_id].p_onturn++;
                    if(rooms[g_id][r_id].p_onturn == rooms[g_id][r_id].players.length)
                        rooms[g_id][r_id].p_onturn = 0;

                    if(win){
                        io.sockets.in(g_id+r_id).emit('get_move', {x: turn, y: num, turn: p_onturn});
                        io.sockets.in(g_id+r_id).emit('get_message', "User: \"" + r_user + "\" wins.");
                    }
                    else
                        io.sockets.in(g_id+r_id).emit('get_move', {x: turn, y: num, turn: p_onturn});
                }
            }

            if(g_id == "schnapsen"){

                player = players[p_onturn];

                if(rooms[g_id][r_id].r_type == '4p'){

                    if(!(rooms[g_id][r_id].ingame) && action == "start"){//innitialization of the game

                        rooms[g_id][r_id].ingame = true;
                        //randomly shuffles the deck
                        cards = new Array(
                            "s4","p4","k4","a4",
                            "s1","p1","k1","a1",
                            "s2","p2","k2","a2",
                            "s3","p3","k3","a3",
                            "s5","p5","k5","a5");

                        logic["deck"] = [];//deck
                        for ( a = 0; a < 20; a++){

                            rand = Math.floor((Math.random()*(20-a)));
                            logic.deck[a] = cards[rand]; 
                            cards.splice(rand,1);
                        }
                        //innitialization of variables used for this game
                        for(b = 0; b < 4; b++){

                            if(!rooms[g_id][r_id].next_round){//if its the first round of the game innitialize the players, later this should not be done since it would reset the players total points

                                logic[players[b]] = [];
                                logic[players[b]]["total_score"] = 0;
                            }
                            logic[players[b]]["can_call"] = [];
                            logic[players[b]]["cards"] = [];
                            for (a = 0; a < 3; a++){ //sets cards for players

                                logic[players[b]].cards[2+a] = "e0";
                                logic[players[b]].cards[a] = logic.deck[a + (b*3)];
                                logic[players[b]].can_call[a] = false;
                                logic[players[b]].can_call[2+a] = false;
                            }
                            logic[players[b]]["score"] = 0; //points 1
                            logic[players[b]]["call_score"] = 0; //if player calls first round and doesnt take the hand
                            logic[players[b]]["has_24"] = false; //if the player has 24
                            logic[players[b]]["has_18"] = false; //if the player has 18
                        }
                        //varius game variables
                        logic["plays"] = [];//bool array used for determining what is going to be played
                        for(a = 0; a < 7; a++)
                            logic["plays"][a] = false;
                        logic["plays"][0] = true;
                        logic["deck"].splice(0,12); //half the cards are dealt innitialy
                        logic["call_player"] = "";
                        logic["adut"] = "";
                        logic["whois"] = 0;
                        logic["game_state"] = "call_adut";
                        logic["whoplay"] = player; //who is the main player
                        logic["whocounter"] = ""; //who is the main player
                        logic["last_play"] = 0; //what is being played 2 = small, 3 = big etc
                        logic["whowon"] = "";
                        logic["main_player"] = "";
                        logic["double_multiplier"] = 1;
                        logic["whoplay_double"] = true;
                        logic["cards_out"] = 0;
                        logic["who_gets_cards"] = [];
                        rooms[g_id][r_id].logic = logic;
                        io.sockets.in(g_id+r_id).emit('start', {p_onturn: rooms[g_id][r_id].p_onturn, next_round: rooms[g_id][r_id].next_round});
                        io.sockets.in(g_id+r_id).emit('notification', {msg: player + " is choosing adut."});

                    }else if(rooms[g_id][r_id].ingame){//game moves
                        
                        num_index = players.indexOf(logic["whoplay"]);
                        player1 = players[num_index];
                        player2 = players[(num_index+1)%4];
                        player3 = players[(num_index+2)%4];
                        player4 = players[(num_index+3)%4];

                        if(action == "card"){

                            if(logic.game_state == "call_adut"){

                                io.sockets.in(g_id+r_id).emit('show_adut', {card: turn, pos: 0, player: player});
                                logic.adut = turn;
                                logic.game_state = "what_to_play";
                                if(logic["game_state"] == "what_to_play"){//sends remaining cards

                                    for (a = 0; a < 2; a++){ //sets cards for players

                                        logic[player1].cards[3+a] = logic.deck[a];
                                        logic[player2].cards[3+a] = logic.deck[2+a];
                                        logic[player3].cards[3+a] = logic.deck[4+a];
                                        logic[player4].cards[3+a] = logic.deck[6+a];
                                    }
                                    logic[player1].has_24 = schnapsen_has_24(logic[player1].cards, logic.adut);
                                    logic[player2].has_24 = schnapsen_has_24(logic[player2].cards, logic.adut);
                                    logic[player3].has_24 = schnapsen_has_24(logic[player3].cards, logic.adut);
                                    logic[player4].has_24 = schnapsen_has_24(logic[player4].cards, logic.adut);
                                    logic.deck.splice(0,8);
                                    logic.whois = 0;
                                    io.sockets.in(g_id+r_id).emit('deal_cards', {begin: 3, end: 5});
                                    io.sockets.in(g_id+r_id).emit('what_to_play_state', {player: player, play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier, can_pass: true, can_double: false});                                           
                                    io.sockets.in(g_id+r_id).emit('announce_plays', {play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier});
                                    io.sockets.in(g_id+r_id).emit('notification', {msg: player + " is choosing what to play."});
                                }
                            }else if(logic["game_state"] == "play"){//game starts here after players chose what to play

                                if(logic["last_play"] == 0 || logic["last_play"] == 1){

                                    if(logic.whois == 0){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic.main_player = player;
                                    }
                                    logic[player].current = logic[player].cards[turn]; //saves the selected card
                                    logic[player].currentpos = turn;
                                    logic[player].cards[turn] = "e0";
                                    if(logic.whois != 0){

                                        adut_c = logic.adut.split('')[0];
                                        card1_c = logic[logic.main_player].current.split('')[0];
                                        card1_v = parseInt(logic[logic.main_player].current.split('')[1]);
                                        card2_c = logic[player].current.split('')[0];
                                        card2_v = parseInt(logic[player].current.split('')[1]);
                                        if(card1_c != card2_c){

                                            for(a = 0; a < 5; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                            if(card2_c != adut_c)
                                                for(a = 0; a < 5; a++)
                                                    if(logic[player].cards[a].split('')[0] == adut_c )
                                                        valid_move = false;
                                        }
                                        if(valid_move){

                                            io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards});
                                            if(logic.whois == 3){

                                                sum = schnapsen_points(card1_v);
                                                p_win = logic.main_player;
                                                for(a = 0; a < 4; a++){

                                                    if(p_win != players[a]){

                                                        card2_c = logic[players[a]].current.split('')[0];
                                                        card2_v = parseInt(logic[players[a]].current.split('')[1]);
                                                        sum += schnapsen_points(card2_v);
                                                        if((card1_c != card2_c && card2_c == adut_c) || (card1_c == card2_c && card1_v < card2_v)){

                                                            p_win = players[a];
                                                            card1_c = logic[players[a]].current.split('')[0];
                                                            card1_v = parseInt(logic[players[a]].current.split('')[1]);
                                                        }
                                                    }
                                                }
                                                if(p_win == player1 || p_win == player3){

                                                    logic[player1].score += sum +logic[player1].call_score + logic[player3].call_score;
                                                    logic[player3].score += sum + logic[player1].call_score + logic[player3].call_score;
                                                    logic[player1].call_score = 0;
                                                    logic[player3].call_score = 0;
                                                    logic.who_gets_cards.push(player1);
                                                    logic.who_gets_cards.push(player3);
                                                }
                                                else{

                                                    logic[player2].score += sum + logic[player2].call_score + logic[player4].call_score;
                                                    logic[player4].score += sum + logic[player2].call_score + logic[player4].call_score;
                                                    logic[player2].call_score = 0;
                                                    logic[player4].call_score = 0;
                                                    logic.who_gets_cards.push(player2);
                                                    logic.who_gets_cards.push(player4);
                                                }
                                                logic.cards_out++;
                                                rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].players.indexOf(p_win);
                                                send_points = true;
                                                logic[player].can_call = schnapsen_call(logic[player].cards);
                                                socket.emit('send_my_calls', {calls: logic[player].can_call});
                                                logic["whois"] = 0;
                                                valid_move = false;
                                            }
                                        }else{

                                            socket.emit('invalid_move', {card: logic[player][turn], player: player, pos: turn})
                                            logic[player].cards[turn] = logic[player]["current"];
                                        }
                                    }
                                    if(valid_move){

                                        logic[player].can_call = schnapsen_call(logic[player].cards);
                                        socket.emit('send_my_calls', {calls: logic[player].can_call});
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == 4)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        logic["whois"]++;
                                    }
                                    
                                }else if(logic["last_play"] == 2){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);
                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c)
                                            for(a = 0; a < 5; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_small_card', {card: logic[player]["current"], player: player, pos: turn, num: logic["cards_out"], whois: logic["whois"]});
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if(card1_c == card2_c && card1_v > card2_v){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 4){

                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 6 && !win){

                                            win = true;
                                            logic["whowon"] = player;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 3){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);

                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c)
                                            for(a = 0; a < 5; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if(card1_c == card2_c && card1_v < card2_v){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 4){

                                            logic.who_gets_cards.push(logic.whoplay);
                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 5 && !win){

                                            win = true;
                                            logic["whowon"] = logic.whoplay;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 4){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);
                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c){

                                            for(a = 0; a < 5; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                            if(card2_c != adut_c)
                                                for(a = 0; a < 5; a++)
                                                    if(logic[player].cards[a].split('')[0] == adut_c )
                                                        valid_move = false;
                                        }
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if((card1_c == card2_c && card1_v < card2_v) || (card1_c != adut_c && card2_c == adut_c)){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 4){

                                            logic.who_gets_cards.push(logic.whoplay);
                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 5 && !win){

                                            win = true;
                                            logic["whowon"] = logic.whoplay;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 5){

                                    io.sockets.in(g_id+r_id).emit('show_24', {player: player});
                                    logic["whowon"] = logic.whoplay;
                                    win = true;
                                    send_points = true;
                                }
                            }
                        }else if(logic["game_state"] == "what_to_play"){

                            if(action == "pass")
                                logic.plays[0] = true;
                            if(action == "snops")
                                logic.plays[1] = true;
                            if(action == "small")
                                logic.plays[2] = true;
                            if(action == "big")
                                logic.plays[3] = true;
                            if(action == "twelve")
                                logic.plays[4] = true;
                            if(action == "eighteen")
                                logic.plays[5] = true;
                            if(action == "twenty-four"){

                                logic.game_state = "play";
                                logic.whoplay = player;
                                logic.last_play = 6;
                                io.sockets.in(g_id+r_id).emit('play_state', {play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier});
                                logic.whois = 0;
                                rooms[g_id][r_id].p_onturn = players.indexOf(logic.whoplay);
                            }else if (action != "twenty-four"){

                                if(action == "double"){

                                    logic.double_multiplier *=2;
                                    if(logic.whocounter != logic.whoplay)
                                        logic.whocounter = player;
                                }else{

                                    for(a = 5; a >= 0; a--){

                                        if(logic.plays[a]){

                                            if(logic.last_play < a){
                                                logic.whoplay = player;
                                                logic.double_multiplier = 1;
                                            }
                                            
                                            logic.last_play = a;
                                            a = -1;
                                        }
                                    }
                                }
                                if(logic.whoplay_double){

                                    rooms[g_id][r_id].p_onturn++;
                                    if(rooms[g_id][r_id].p_onturn == 4)
                                        rooms[g_id][r_id].p_onturn = 0;
                                }
                                if(players[rooms[g_id][r_id].p_onturn] == logic.whoplay){

                                    if(logic.whoplay_double && logic.double_multiplier == 2){

                                        io.sockets.in(g_id+r_id).emit('what_to_play_state', {player: players[rooms[g_id][r_id].p_onturn], play: 6, whoplay: logic.whoplay, m: 4, can_pass: true, can_double: true});
                                        logic.whoplay_double = false;
                                    }else{

                                        io.sockets.in(g_id+r_id).emit('announce_plays', {play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier});
                                        io.sockets.in(g_id+r_id).emit('notification', {msg: ""});
                                        logic.game_state = "play";
                                        if(logic.last_play <= 1)
                                            for(a = 0; a < players.length; a++)
                                                logic[players[a]].can_call = schnapsen_call(logic[players[a]].cards);
                                        io.sockets.in(g_id+r_id).emit('play_state', {play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier});
                                        logic.whois = 0;
                                        rooms[g_id][r_id].p_onturn = players.indexOf(logic.whoplay); 
                                    }
                                }else{
                                    can_double = false;
                                    if(logic.double_multiplier == 1 && players.indexOf(logic.whoplay)%2 != rooms[g_id][r_id].p_onturn%2)
                                        can_double = true;
                                    io.sockets.in(g_id+r_id).emit('what_to_play_state', {player: players[rooms[g_id][r_id].p_onturn], play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier, can_pass: true, can_double: can_double});
                                    io.sockets.in(g_id+r_id).emit('notification', {msg: players[rooms[g_id][r_id].p_onturn] + " is choosing what to play."});
                                }
                                io.sockets.in(g_id+r_id).emit('announce_plays', {play: logic.last_play, whoplay: logic.whoplay, m: logic.double_multiplier});
                            }
                        }


                        if(action == "call"){

                            adut_c = logic[player].cards[turn].split("")[0];
                            if(logic[player].can_call[turn] && logic.whois == 0){

                                logic.main_player = player;
                                tarr = [];
                                if(logic[player].score == 0){

                                    if(adut_c == logic.adut.split("")[0])
                                        logic[player].call_score = 40;
                                    else
                                        logic[player].call_score = 20;
                                }else{

                                    if(player == player1 || player == player3){

                                        if(adut_c == logic.adut.split("")[0]){

                                            logic[player1].score+=40;
                                            logic[player3].score+=40;
                                        }else{

                                            logic[player1].score+=20;
                                            logic[player3].score+=20;
                                        }
                                    }else{

                                        if(adut_c == logic.adut.split("")[0]){

                                            logic[player2].score+=40;
                                            logic[player4].score+=40;
                                        }else{

                                            logic[player2].score+=20;
                                            logic[player4].score+=20;
                                        }
                                    }
                                }
                                p_win = player;
                                send_points = true;
                                io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, new_hand: logic.who_gets_cards, king: (adut_c + "3")});
                                logic[player].current = logic[player].cards[turn]; //saves the selected card
                                logic[player].currentpos = turn;
                                logic[player].cards[turn] = "e0";
                                logic.who_gets_cards.splice(0,10);
                                logic[player].can_call = schnapsen_call(logic[player].cards);
                                socket.emit('send_my_calls', {calls: logic[player].can_call});
                                logic.whois++;
                                rooms[g_id][r_id].p_onturn++;
                                if(rooms[g_id][r_id].p_onturn == players.length)
                                    rooms[g_id][r_id].p_onturn = 0;
                            }
                        }

                        if(send_points){

                            tarr = [];
                            p_lose = "";
                            if(p_win == player1 || p_win == player3){

                                tarr.push(player1);
                                tarr.push(player3);
                                p_lose = player2;
                            }else{

                                tarr.push(player2);
                                tarr.push(player4);
                                p_lose = player1;
                            }
                            if(logic["last_play"] == 0 || logic["last_play"] == 1){

                                if(logic.last_play == 0 && (logic[p_win].score >= 66 || logic.cards_out == 5)){

                                    if(logic[p_lose].score == 0){

                                        logic[tarr[0]].total_score += 3 * logic.double_multiplier;
                                        logic[tarr[1]].total_score += 3 * logic.double_multiplier;
                                    }else if(logic[p_lose].score <= 33){

                                        logic[tarr[0]].total_score += 2 * logic.double_multiplier;
                                        logic[tarr[1]].total_score += 2 * logic.double_multiplier;
                                    }else{

                                        logic[tarr[0]].total_score += 1 * logic.double_multiplier;
                                        logic[tarr[1]].total_score += 1 * logic.double_multiplier;
                                    }
                                    win = true;
                                }
                                if(logic.last_play == 1 && logic[p_win].score >= 66){

                                    logic[tarr[0]].total_score += 6 * logic.double_multiplier;
                                    logic[tarr[1]].total_score += 6 * logic.double_multiplier;
                                    win = true;
                                }else if(logic.last_play == 1 && (p_win != logic.whoplay || logic.cards_out == 3)){

                                    logic[tarr[0]].total_score += 6 * logic.double_multiplier;
                                    logic[tarr[1]].total_score += 6 * logic.double_multiplier;
                                    win = true;
                                }

                                io.sockets.in(g_id+r_id).emit('current_points');
                            }else if(logic["last_play"] == 2){

                                logic[tarr[0]].total_score += 7 * logic.double_multiplier;
                                logic[tarr[1]].total_score += 7 * logic.double_multiplier;
                            }else if(logic["last_play"] == 3){

                                logic[tarr[0]].total_score += 9 * logic.double_multiplier;
                                logic[tarr[1]].total_score += 9 * logic.double_multiplier;
                            }else if(logic["last_play"] == 4){

                                logic[tarr[0]].total_score += 12 * logic.double_multiplier;
                                logic[tarr[1]].total_score += 12 * logic.double_multiplier;
                            }else if(logic["last_play"] == 5){

                                logic[tarr[0]].total_score += 24 * logic.double_multiplier;
                                logic[tarr[1]].total_score += 24 * logic.double_multiplier;
                            }
                        }
                    }
                    
                    if(win){//if somebody wins you cant do any logic for this room anymore

                        io.sockets.in(g_id+r_id).emit('send_total_score', {score1: logic[players[0]].total_score, score2: logic[players[1]].total_score, score3: logic[players[2]].total_score, score4: logic[players[3]].total_score, round: rooms[g_id][r_id].round});
                        winner = [];
                        if(logic[players[0]].total_score >= 25)
                            winner.push(0);
                        if(logic[players[1]].total_score >= 25)
                            winner.push(1);
                        if(logic[players[2]].total_score >= 25)
                            winner.push(2);
                        if(logic[players[3]].total_score >= 25)
                            winner.push(3);
                        if(winner.length > 0){

                            io.sockets.in(g_id+r_id).emit('add_winner', {pos: winner, round: rooms[g_id][r_id].round});
                            rooms[g_id][r_id].do_logic = true;
                        }else{

                            rooms[g_id][r_id].next_round = true;
                            rooms[g_id][r_id].ingame = false;
                            rooms[g_id][r_id].round++;
                            rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].round%4;
                            io.sockets.in(g_id+r_id).emit('new_round', {p_onturn: rooms[g_id][r_id].p_onturn});
                        }
                    }

                    rooms[g_id][r_id].logic = logic;
                    io.sockets.in(g_id+r_id).emit('who_turn', {turn: rooms[g_id][r_id].p_onturn, player: players[rooms[g_id][r_id].p_onturn]});
                    rooms[g_id][r_id].do_logic = false;
                }if(rooms[g_id][r_id].r_type == '3p'){

                    if(p_onturn == 0){

                        player1 = players[0];
                        player2 = players[1];
                        player3 = players[2];
                    }else if(p_onturn == 1){

                        player1 = players[1];
                        player2 = players[2];
                        player3 = players[0];
                    }else if(p_onturn == 2){

                        player1 = players[2];
                        player2 = players[0];
                        player3 = players[1];
                    }
                    
                    send_points = false;
                    p_win = "";

                    if(!(rooms[g_id][r_id].ingame) && action == "start"){//innitialization of the game

                        rooms[g_id][r_id].ingame = true;
                        cards = new Array(
                            "s4","p4","k4","a4",
                            "s1","p1","k1","a1",
                            "s2","p2","k2","a2",
                            "s3","p3","k3","a3",
                            "s5","p5","k5","a5");

                        logic["deck"] = [];//deck
                        for ( a = 0; a < 20; a++){

                            rand = Math.floor((Math.random()*(20-a)));
                            logic["deck"][a] = cards[rand]; 
                            cards.splice(rand,1);
                        }
                        for(b = 0; b < 3; b++){

                            if(!rooms[g_id][r_id].next_round){

                                logic[players[b]] = [];
                                logic[players[b]]["total_score"] = 0;
                            }
                            logic[players[b]]["can_call"] = [];
                            logic[players[b]]["cards"] = [];
                            for (a = 0; a < 3; a++){ //sets cards for players

                                logic[players[b]].cards[a] = logic["deck"][a + (b*3)];
                                logic[players[b]].cards[3+a] = "e0";
                                logic[players[b]].can_call[a] = false;
                                logic[players[b]].can_call[3+a] = false;
                            }
                            logic[players[b]]["score"] = 0; //points 1
                            logic[players[b]]["call_score"] = 0; //if player calls first round and doesnt take the hand
                            logic[players[b]]["switch_counter"] = 0;
                            logic[players[b]]["has_24"] = false;
                        }
                        logic["plays"] = [];
                        for(a = 0; a < 6; a++)
                            logic["plays"][a] = false;
                        logic["deck"].splice(0,9); //half the cards are dealt innitialy
                        logic["call_player"] = "";
                        logic["adut"] = "";
                        logic["whois"] = 0;
                        logic["game_state"] = "call_adut";
                        logic["plays"][0] = true;
                        logic["whoplay"] = player; //who is the main player
                        logic["whocounter"] = ""; //who is the main player
                        logic["last_play"] = 0; //what is being played 2 = small, 3 = big etc
                        logic["whowon"] = "";
                        logic["main_player"] = "";
                        logic["double_multiplier"] = 1;
                        logic["cards_out"] = 0;
                        logic["who_gets_cards"] = [];
                        rooms[g_id][r_id].logic = logic;
                        io.sockets.in(g_id+r_id).emit('start', {p_onturn: rooms[g_id][r_id].p_onturn, next_round: rooms[g_id][r_id].next_round});

                    }else if(rooms[g_id][r_id].ingame){//game moves
                            
                        if(action == "card"){

                            if(logic["game_state"] == "call_adut"){

                                if(turn == "pick"){

                                    io.sockets.in(g_id+r_id).emit('show_adut', {card: logic["deck"][0], pos: 4, player: player});
                                    logic["adut"] = logic["deck"][0];
                                    logic["game_state"] = "switch";
                                }else if(turn == "p6" || turn == "a6" || turn == "k6" || turn == "s6"){//sends adut

                                    io.sockets.in(g_id+r_id).emit('show_adut', {card: turn, pos: 0, player: player});
                                    logic["adut"] = turn;
                                    logic["game_state"] = "switch";
                                }
                                if(logic["game_state"] == "switch"){//sends remaining cards

                                    for (a = 0; a < 3; a++){ //sets cards for players

                                        logic[player1].cards[3+a] = logic["deck"][a];
                                        logic[player2].cards[3+a] = logic["deck"][3+a];
                                        logic[player3].cards[3+a] = logic["deck"][6+a];
                                    }
                                    adutc = logic["adut"].split("")[0];
                                    logic[player1].has_24 = schnapsen_has_24(logic[player1].cards, adutc);
                                    logic[player2].has_24 = schnapsen_has_24(logic[player2].cards, adutc);
                                    logic[player3].has_24 = schnapsen_has_24(logic[player3].cards, adutc);
                                    logic["deck"].splice(0,9);
                                    logic.whois = 0;
                                    io.sockets.in(g_id+r_id).emit('deal_cards', {begin: 3, end: 6});
                                    io.sockets.in(g_id+r_id).emit('switch_state', {player: player, whois: 0});
                                }
                            }else if(logic["game_state"] == "switch"){//sends switch commands for selected cards

                                if(logic[player].can_call[turn]){

                                    logic[player].switch_counter--;
                                    socket.emit('deselect_switch', {pos: turn, counter: logic[player].switch_counter});
                                    logic[player].can_call[turn] = false;
                                }else if(!logic[player].can_call[turn] && logic[player].switch_counter < 2){

                                    logic[player].switch_counter++;
                                    socket.emit('select_switch', {pos: turn, counter: logic[player].switch_counter});
                                    logic[player].can_call[turn] = true;
                                }
                            }else if(logic["game_state"] == "play"){//game starts here after players chose what to play

                                if(logic["last_play"] == 0 || logic["last_play"] == 1){

                                    if(logic.whois == 0){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic["main_player"] = player;
                                    }
                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";
                                    if(logic.whois != 0){

                                        adut_c = logic["adut"].split('')[0];
                                        card1_c = logic[logic["main_player"]].current.split('')[0];
                                        card1_v = parseInt(logic[logic["main_player"]].current.split('')[1]);
                                        card2_c = logic[player].current.split('')[0];
                                        card2_v = parseInt(logic[player].current.split('')[1]);
                                        if(card1_c != card2_c){

                                            for(a = 0; a < 6; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                            if(card2_c != adut_c)
                                                for(a = 0; a < 6; a++)
                                                    if(logic[player].cards[a].split('')[0] == adut_c )
                                                        valid_move = false;
                                        }
                                        if(valid_move){

                                            io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player]["current"], player: player, pos: turn, new_hand: logic.who_gets_cards});
                                            if(logic["whois"] == 2){

                                                sum = schnapsen_points(card1_v);
                                                p_win = logic["main_player"];
                                                for(a = 0; a < 3; a++){

                                                    if(p_win != players[a]){

                                                        card2_c = logic[players[a]].current.split('')[0];
                                                        card2_v = parseInt(logic[players[a]].current.split('')[1]);
                                                        sum += schnapsen_points(card2_v);
                                                        if((card1_c != card2_c && card2_c == adut_c) || (card1_c == card2_c && card1_v < card2_v)){

                                                            p_win = players[a];
                                                            card1_c = logic[players[a]].current.split('')[0];
                                                            card1_v = parseInt(logic[players[a]].current.split('')[1]);
                                                        }
                                                    }
                                                }
                                                if(p_win == logic["whoplay"]){

                                                    logic[logic["whoplay"]].score += sum;
                                                    logic[logic["whoplay"]].score += logic[logic["whoplay"]].call_score
                                                    logic[logic["whoplay"]].call_score = 0;
                                                    logic.who_gets_cards.push(p_win);
                                                }
                                                else{

                                                    for(a = 0; a < 3; a++)
                                                        if(logic["whoplay"] != players[a]){

                                                            logic[players[a]].score += sum;
                                                            logic.who_gets_cards.push(players[a]);
                                                        }
                                                }
                                                logic["cards_out"]++;
                                                rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].players.indexOf(p_win);
                                                send_points = true;
                                                logic[player].can_call = schnapsen_call(logic[player].cards);
                                                socket.emit('send_my_calls', {calls: logic[player].can_call});
                                                logic["whois"] = 0;
                                                valid_move = false;
                                            }
                                        }else{

                                            socket.emit('invalid_move', {card: logic[player][turn], player: player, pos: turn})
                                            logic[player].cards[turn] = logic[player]["current"];
                                        }
                                    }
                                    if(valid_move){

                                        logic[player].can_call = schnapsen_call(logic[player].cards);
                                        socket.emit('send_my_calls', {calls: logic[player].can_call});
                                        console.log("\n\n CARDS: " + logic[player].cards + "\n\n")
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == 3)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        logic["whois"]++;
                                    }
                                    
                                }else if(logic["last_play"] == 2){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);
                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c)
                                            for(a = 0; a < 6; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_small_card', {card: logic[player]["current"], player: player, pos: turn, num: logic["cards_out"], whois: logic["whois"]});
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if(card1_c == card2_c && card1_v > card2_v){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 3){

                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 6 && !win){

                                            win = true;
                                            logic["whowon"] = player;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 3){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);

                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c)
                                            for(a = 0; a < 6; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if(card1_c == card2_c && card1_v < card2_v){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 3){

                                            logic.who_gets_cards.push(logic.whoplay);
                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 6 && !win){

                                            win = true;
                                            logic["whowon"] = logic.whoplay;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 4){

                                    logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                    logic[player]["currentpos"] = turn;
                                    logic[player].cards[turn] = "e0";

                                    adut_c = logic["adut"].split('')[0];
                                    card1_c = logic[logic.whoplay].current.split('')[0];
                                    card1_v = parseInt(logic[logic.whoplay].current.split('')[1]);
                                    card2_c = logic[player].current.split('')[0];
                                    card2_v = parseInt(logic[player].current.split('')[1]);
                                    if(logic["whoplay"] != player){

                                        if(card1_c != card2_c){

                                            for(a = 0; a < 6; a++)
                                                if(logic[player].cards[a].split('')[0] == card1_c)
                                                    valid_move = false;
                                            if(card2_c != adut_c)
                                                for(a = 0; a < 6; a++)
                                                    if(logic[player].cards[a].split('')[0] == adut_c )
                                                        valid_move = false;
                                        }
                                    }

                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards});
                                        logic.who_gets_cards.splice(0,10);
                                        logic["whois"]++;
                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == players.length)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic["whois"] >= 2){

                                            if((card1_c == card2_c && card1_v < card2_v) || (card1_c != adut_c && card2_c == adut_c)){

                                                win = true;
                                                logic["whowon"] = player;
                                                send_points = true;
                                            }
                                        }
                                        if(logic["whois"] == 3){

                                            logic.who_gets_cards.push(logic.whoplay);
                                            logic["cards_out"]++;
                                            logic["whois"] = 0;
                                        }

                                        if(logic["cards_out"] == 6 && !win){

                                            win = true;
                                            logic["whowon"] = logic.whoplay;
                                            send_points = true;
                                        }
                                    }else{

                                        socket.emit('invalid_move', {pos: turn});
                                        logic[player][turn] = logic[player].current;
                                    }
                                }else if(logic["last_play"] == 5){

                                    io.sockets.in(g_id+r_id).emit('show_24', {player: player});
                                    logic["whowon"] = logic.whoplay;
                                    win = true;
                                    send_points = true;
                                }
                            }
                        }

                        if(action == "finish-select" && logic["game_state"] == "switch"){

                            if(logic[player]["switch_counter"] > 0){

                                counter = 0;
                                for(a = 0; a < 6; a++){

                                    if(logic[player].can_call[a]){

                                        temp = logic[player].cards[a];
                                        logic[player].cards[a] = logic["deck"][counter];
                                        logic["deck"][counter] = temp;
                                        socket.emit('send_my_card', {card: logic[player].cards[a], pos: a});
                                        counter++;
                                        logic[player].can_call[a] = false;
                                    }
                                }
                                logic[player].has_24 = schnapsen_has_24(logic[player].cards, adutc);
                            }
                            io.sockets.in(g_id+r_id).emit('what_to_play_state', {whois: logic.whois, player: players[rooms[g_id][r_id].p_onturn], play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"], has_24: logic[player].has_24, pass: logic[player]["switch_counter"]});  
                            logic[player]["switch_counter"] = 0;                         
                            logic.whois++;
                            logic["game_state"] = "what_to_play";
                        }

                        if(logic["game_state"] == "what_to_play"){

                            if(action == "pass")
                                logic["plays"][0] = true;
                            if(action == "snops")
                                logic["plays"][1] = true;
                            if(action == "small")
                                logic["plays"][2] = true;
                            if(action == "big")
                                logic["plays"][3] = true;
                            if(action == "twelve")
                                logic["plays"][4] = true;
                            if(action == "twenty-four" && logic[player].has_24){

                                logic["game_state"] = "play";
                                logic["whoplay"] = player;
                                logic["last_play"] = 5;
                                io.sockets.in(g_id+r_id).emit('play_state', {play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"]});
                                logic["whois"] = 0;
                                rooms[g_id][r_id].p_onturn = players.indexOf(logic["whoplay"]);
                            }else if (action != "twenty-four"){

                                if(turn == "play_selected"){

                                    if(action == "double"){

                                        logic["double_multiplier"] *=2;
                                        if(logic["whocounter"] == "")
                                            logic["whocounter"] = player;
                                    }else{

                                        for(a = 4; a >= 0; a--){

                                            if(logic["plays"][a]){

                                                if(logic["last_play"] < a){
                                                    logic["whoplay"] = player;
                                                    logic["double_multiplier"] = 1;
                                                }
                                                
                                                logic["last_play"] = a;
                                                a = -1;
                                            }
                                        }
                                    }
                                    cont = true;
                                    if(logic.double_multiplier > 1 && players[rooms[g_id][r_id].p_onturn] == logic["whoplay"]){

                                        logic["game_state"] = "play";
                                        if(logic["last_play"] <= 1){

                                            logic[player1].can_call = schnapsen_call(logic[player1].cards);
                                            logic[player2].can_call = schnapsen_call(logic[player2].cards);
                                            logic[player3].can_call = schnapsen_call(logic[player3].cards);
                                        }
                                        io.sockets.in(g_id+r_id).emit('play_state', {play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"]});
                                        logic["whois"] = 0;
                                        rooms[g_id][r_id].p_onturn = players.indexOf(logic["whoplay"]);
                                        cont = false;
                                    }
                                    if(cont){

                                        rooms[g_id][r_id].p_onturn++;
                                        if(rooms[g_id][r_id].p_onturn == 3)
                                            rooms[g_id][r_id].p_onturn = 0;
                                        if(logic.double_multiplier > 1 && (logic["last_play"] > 0 || logic.whois >= 100 || players[rooms[g_id][r_id].p_onturn] == logic["whoplay"])){

                                            if(!logic[players[rooms[g_id][r_id].p_onturn]].has_24 && players[rooms[g_id][r_id].p_onturn] != logic["whoplay"]){

                                                rooms[g_id][r_id].p_onturn++;
                                                if(rooms[g_id][r_id].p_onturn == 3)
                                                    rooms[g_id][r_id].p_onturn = 0;
                                            }
                                            io.sockets.in(g_id+r_id).emit('what_to_play_state', {whois: logic.whois, player: players[rooms[g_id][r_id].p_onturn], play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"], has_24: logic[players[rooms[g_id][r_id].p_onturn]].has_24, pass: logic[players[rooms[g_id][r_id].p_onturn]]["switch_counter"]});  
                                            io.sockets.in(g_id+r_id).emit('announce_plays', {play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"]});
                                        }else if(logic.double_multiplier == 1 && players[rooms[g_id][r_id].p_onturn] == logic["whoplay"]){

                                            logic["game_state"] = "play";
                                            if(logic["last_play"] <= 1){

                                                logic[player1].can_call = schnapsen_call(logic[player1].cards);
                                                logic[player2].can_call = schnapsen_call(logic[player2].cards);
                                                logic[player3].can_call = schnapsen_call(logic[player3].cards);
                                            }
                                            io.sockets.in(g_id+r_id).emit('play_state', {play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"]});
                                            logic["whois"] = 0;
                                            rooms[g_id][r_id].p_onturn = players.indexOf(logic["whoplay"]);
                                        }else if(logic.double_multiplier == 1 || logic["last_play"] == 0){

                                            if(logic.double_multiplier > 1 && logic["last_play"] == 0)
                                                logic.whois = 100;
                                            logic["game_state"] = "switch";
                                            io.sockets.in(g_id+r_id).emit('switch_state', {player: players[rooms[g_id][r_id].p_onturn], whois: 1});
                                            io.sockets.in(g_id+r_id).emit('announce_plays', {play: logic["last_play"], whoplay: logic["whoplay"], m: logic["double_multiplier"]});
                                        }
                                    }
                                }
                            }
                        }


                        if(action == "call"){

                            adut_c = logic[player].cards[turn].split("")[0];
                            if(logic[player].can_call[turn] && logic["whois"] == 0){

                                logic["main_player"] = player;
                                tarr = [];
                                if(logic[player].score == 0){

                                    if(adut_c == logic["adut"].split("")[0])
                                        logic[player]["call_score"] = 40;
                                    else
                                        logic[player]["call_score"] = 20;
                                }else{

                                    if(logic["main_player"] == logic["whoplay"])
                                        tarr.push(player);
                                    else{
                                        for(a = 0; a < 3; a++)
                                            if(players[a] != logic["whoplay"])
                                                tarr.push(players[a]);
                                    }
                                    for(a = 0; a < tarr.length; a++){

                                        if(adut_c == logic["adut"].split("")[0])
                                            logic[tarr[a]]["score"]+=40;
                                        else
                                            logic[tarr[a]]["score"]+=20;
                                    }
                                }
                                p_win = player;
                                send_points = true;
                                io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, new_hand: logic.who_gets_cards, king: (adut_c + "3")});
                                logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                logic[player]["currentpos"] = turn;
                                logic[player].cards[turn] = "e0";
                                logic.who_gets_cards.splice(0,10);
                                logic[player].can_call = schnapsen_call(logic[player].cards);
                                socket.emit('send_my_calls', {calls: logic[player].can_call});
                                logic["whois"]++;
                                rooms[g_id][r_id].p_onturn++;
                                if(rooms[g_id][r_id].p_onturn == players.length)
                                    rooms[g_id][r_id].p_onturn = 0;
                            }
                        }

                        if(send_points){

                            if(logic["last_play"] == 0 || logic["last_play"] == 1){

                                ooc_win = "";
                                ooc_lose = "";
                                ooc_bool = false;
                                
                                if(logic["whoplay"] == player1){

                                    ooc_win = logic["whoplay"];
                                    ooc_lose = player2;
                                }else{

                                    ooc_win = logic["whoplay"];
                                    ooc_lose = player1;
                                }

                                if(logic.cards_out == 6){

                                    if(p_win == logic["whoplay"]){

                                        if(logic["whoplay"] > player2){
                                            
                                            ooc_win = logic["whoplay"];
                                            ooc_lose = player2;
                                        }
                                        else{

                                            ooc_win = player2;
                                            ooc_lose = logic["whoplay"];
                                        }
                                    }else{

                                        if(logic["whoplay"] > player1){

                                            ooc_win = logic["whoplay"];
                                            ooc_lose = player1;
                                        }
                                        else{

                                            ooc_win = player1;
                                            ooc_lose = logic["whoplay"];
                                        }
                                    }
                                    ooc_bool = true;
                                }   
                                
                                if((logic["last_play"] == 0 && (!ooc_bool && p_win == logic["whoplay"] && logic[p_win].score >= 66) || (ooc_bool && ooc_win == logic["whoplay"])) ||
                                   (logic["last_play"] == 1 && p_win == logic["whoplay"] && logic[p_win].score >= 66 && logic.cards_out <= 4)){

                                    win = true;
                                    if(logic["last_play"] == 0){

                                        if(logic[ooc_lose].score == 0)
                                            logic[p_win].total_score += 3 * logic.double_multiplier;
                                        else if(logic[ooc_lose].score < 33)
                                            logic[p_win].total_score += 2 * logic.double_multiplier;
                                        else
                                            logic[p_win].total_score += 1 * logic.double_multiplier;
                                    }else
                                        logic[p_win].total_score += 6 * logic.double_multiplier;
                                }else if((logic["last_play"] == 0 && (!ooc_bool && logic[p_win].score >= 66) || (ooc_bool && ooc_win != logic["whoplay"])) ||
                                         (logic["last_play"] == 1 && (p_win != logic["whoplay"] || logic.cards_out == 4))) {

                                    win = true;
                                    temp_score = 0;
                                    if(logic[logic["whoplay"]].score == 0)
                                        temp_score = 3;
                                    else if(logic[logic["whoplay"]].score < 33)
                                        temp_score = 2;
                                    else
                                        temp_score = 1;
                                    if(logic["last_play"] == 1)
                                        temp_score = 6;
                                    temp_score *= logic.double_multiplier;
                                    for(a = 0; a < 3; a++)
                                        if(players[a] != logic["whoplay"])
                                            logic[players[a]].total_score += temp_score;
                                }

                                io.sockets.in(g_id+r_id).emit('current_points');
                            }else if(logic["last_play"] == 2){

                                if(logic["whowon"] == logic["whoplay"]){

                                    logic[logic["whoplay"]].total_score += 7 * logic.double_multiplier;
                                }else{

                                    for(a = 0; a < 3; a++){

                                        if(logic["whoplay"] != players[a]){

                                            logic[players[a]].total_score += 7 * logic.double_multiplier;
                                        }
                                    }
                                }
                            }else if(logic["last_play"] == 3){

                                if(logic["whowon"] == logic["whoplay"]){

                                    logic[logic["whoplay"]].total_score += 9 * logic.double_multiplier;
                                }else{

                                    for(a = 0; a < 3; a++){

                                        if(logic["whoplay"] != players[a]){

                                            logic[players[a]].total_score += 9 * logic.double_multiplier;
                                        }
                                    }
                                }
                            }else if(logic["last_play"] == 4){

                                if(logic["whowon"] == logic["whoplay"]){

                                    logic[logic["whoplay"]].total_score += 12 * logic.double_multiplier;
                                }else{

                                    for(a = 0; a < 3; a++){

                                        if(logic["whoplay"] != players[a]){

                                            logic[players[a]].total_score += 12 * logic.double_multiplier;
                                        }
                                    }
                                }
                            }else if(logic["last_play"] == 5){

                                logic[logic["whoplay"]].total_score += 24 * logic.double_multiplier;
                            }
                        }
                    }
                    
                    if(win){//if somebody wins you cant do any logic for this room anymore

                        io.sockets.in(g_id+r_id).emit('send_total_score', {score1: logic[players[0]].total_score, score2: logic[players[1]].total_score, score3: logic[players[2]].total_score, round: rooms[g_id][r_id].round});
                        winner = [];
                        if(logic[players[0]].total_score >= 25)
                            winner.push(0);
                        if(logic[players[1]].total_score >= 25)
                            winner.push(1);
                        if(logic[players[2]].total_score >= 25)
                            winner.push(2);
                        if(winner.length > 0){

                            io.sockets.in(g_id+r_id).emit('add_winner', {pos: winner, round: rooms[g_id][r_id].round});
                            rooms[g_id][r_id].do_logic = true;
                        }else{

                            rooms[g_id][r_id].next_round = true;
                            rooms[g_id][r_id].ingame = false;
                            rooms[g_id][r_id].round++;
                            rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].round%3;
                        }
                    }

                    rooms[g_id][r_id].logic = logic;
                    io.sockets.in(g_id+r_id).emit('who_turn', {turn: rooms[g_id][r_id].p_onturn, player: players[rooms[g_id][r_id].p_onturn]});
                    rooms[g_id][r_id].do_logic = false;
                }if(rooms[g_id][r_id].r_type == '2p'){

                    player1 = rooms[g_id][r_id].players[0];
                    player2 = rooms[g_id][r_id].players[1];
                    send_points = false;
                    p_win = 0;

                    if(!(rooms[g_id][r_id].ingame) && action == "start"){//innitialization of the game

                        rooms[g_id][r_id].ingame = true;
                        cards = new Array(
                            "s4","p4","k4","a4",
                            "s1","p1","k1","a1",
                            "s2","p2","k2","a2",
                            "s3","p3","k3","a3",
                            "s5","p5","k5","a5");

                        logic["deck"] = [];//deck
                        for ( a = 0; a < 20; a++){

                            rand = Math.floor((Math.random()*(20-a)));
                            logic["deck"][a] = cards[rand]; 
                            cards.splice(rand,1);
                        }
                        for(a = 0; a < players.length; a++){

                            if(!rooms[g_id][r_id].next_round){

                                logic[players[a]] = [];
                                logic[players[a]]["total_score"] = 0;
                            }
                            logic[players[a]]["score"] = 0; //points 1
                            logic[players[a]]["call_score"] = 0; //if player calls first round and doesnt take anything

                            logic[players[a]]["can_call"] = [];
                            logic[players[a]]["can_switch"] = [];
                            logic[players[a]]["cards"] = [];
                            for (b = 0; b<5; b++){ //sets cards for players

                                logic[players[a]].cards[b] = logic.deck[b+a*5];
                                logic[players[a]].can_call[b] = false;
                                logic[players[a]].can_switch[b] = false;
                            }
                        }
                        logic["adut"] = logic.deck[10]; //adut
                        logic[player1].can_call = schnapsen_call(logic[player1].cards);
                        logic[player1].can_switch = schnapsen_switch(logic[player1].cards, logic.adut);
                        logic[player2].can_call = schnapsen_call(logic[player2].cards);
                        logic[player2].can_switch = schnapsen_switch(logic[player2].cards, logic.adut);
                        logic["deck"].splice(0,11); // 9 cards left
                        logic["closed"] = false;
                        logic["cards_out"] = 0;
                        logic["whois"] = 0;
                        logic["last_card"] = false;
                        logic["main_player"] = player;
                        logic["who_gets_cards"] = "";
                        logic["who_closed"] = "";
                        rooms[g_id][r_id].logic = logic;
                        io.sockets.in(g_id+r_id).emit('start', {p_onturn: rooms[g_id][r_id].p_onturn, next_round: rooms[g_id][r_id].next_round});

                    }else if(rooms[g_id][r_id].ingame){//game moves

                        if(action == "start"){//if player "closes"

                            if(logic["whois"] == 0 && logic["deck"].length > 1){

                                io.sockets.in(g_id+r_id).emit('closed');
                                logic["deck"].splice(0,20);
                                logic["closed"] = true;
                                logic["whoclosed"] = player;
                            }
                        }

                        if(action == "card"){

                            if(logic.whois == 0 || logic.deck.length > 0){

                                io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, new_hand: logic.who_gets_cards, closed: logic.who_closed});
                                if(logic.whois == 0){

                                    logic.main_player = player;
                                    logic.who_gets_cards = "";
                                }
                            }
                            logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                            logic[player]["currentpos"] = turn;
                            logic[player].cards[turn] = "e0";

                            if(logic["whois"] == 1){

                                p_win = logic.main_player;
                                p_lose = player;
                                adut_c = logic.adut.split('')[0];
                                card1_c = logic[logic.main_player].current.split('')[0];
                                card1_v = parseInt(logic[logic.main_player].current.split('')[1]);
                                card2_c = logic[player].current.split('')[0];
                                card2_v = parseInt(logic[player].current.split('')[1]);
                                
                                if(logic.deck.length > 0){
                                    
                                    if((card1_c != card2_c && card2_c == adut_c) || (card1_c == card2_c && card1_v < card2_v)){

                                        p_win = player;
                                        p_lose = logic.main_player;
                                    }
                                    //score
                                    logic[p_win].score += schnapsen_points(card1_v) + schnapsen_points(card2_v);
                                    logic[p_win].score += logic[p_win].call_score
                                    logic[p_win].call_score = 0;
                                    logic.who_gets_cards = p_win;

                                    //new card
                                    if(logic.deck.length > 1){

                                        logic[p_win].cards[logic[p_win].currentpos] = logic.deck[0];
                                        logic[p_lose].cards[logic[p_lose].currentpos] = logic.deck[1];
                                        logic.deck.splice(0,2);
                                        if(logic.deck.length == 1)
                                            io.sockets.in(g_id+r_id).emit('one_card_left');
                                    }else{

                                        logic[p_win].cards[logic[p_win].currentpos] = logic.deck[0];
                                        logic[p_lose].cards[logic[p_lose].currentpos] = logic.adut;
                                        logic.deck.splice(0,1);
                                        io.sockets.in(g_id+r_id).emit('no_card_left');
                                    }
                                    
                                    io.sockets.in(g_id+r_id).emit('deal_card');
                                    logic["whois"] = 0;
                                    rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].players.indexOf(p_win);
                                    send_points = true;
                                    //if players can call and switch
                                    logic[player1].can_call = schnapsen_call(logic[player1].cards);
                                    logic[player1].can_switch = schnapsen_switch(logic[player1].cards, logic.adut);
                                    logic[player2].can_call = schnapsen_call(logic[player2].cards);
                                    logic[player2].can_switch = schnapsen_switch(logic[player2].cards, logic.adut);
                                    io.sockets.in(g_id+r_id).emit('deal_calls');
                                }else{

                                    if(card1_c != card2_c){

                                        for(a = 0; a < 5; a++)
                                            if(logic[player].cards[a].split('')[0] == card1_c)
                                                valid_move = false;
                                        if(card2_c != adut_c) 
                                            for(a = 0; a < 5; a++)
                                                if(logic[player].cards[a].split('')[0] == adut_c )
                                                    valid_move = false;
                                    }
                                    if(valid_move){

                                        io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].current, player: player, pos: turn, new_hand: logic.who_gets_cards, closed: logic.who_closed});
                                        logic.cards_out++;
                                        if((card1_c != card2_c && card2_c == adut_c) || (card1_c == card2_c && card1_v < card2_v)){

                                            p_win = player;
                                            p_lose = logic.main_player;
                                        }

                                        cont = true;
                                        if(logic.who_closed != ""){

                                            if((p_win != logic.who_closed) || (logic.cards_out == 5 && logic[logic.who_closed].score < 66)){

                                                logic[p_win].score = 66;
                                                send_points = true;
                                                cont = false;
                                            }
                                        }

                                        if(logic.cards_out == 5){

                                            logic[p_win].score = 66;
                                            send_points = true;
                                            cont = false;
                                        }
                                        if(cont){

                                            //score
                                            logic[p_win].score += schnapsen_points(card1_v) + schnapsen_points(card2_v);
                                            logic[p_win].score += logic[p_win].call_score
                                            logic[p_win].call_score = 0;
                                            logic.who_gets_cards = p_win;

                                            rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].players.indexOf(p_win);
                                            send_points = true;
                                            logic["whois"] = 0;

                                            //if players can call and switch
                                            logic[player1].can_call = schnapsen_call(logic[player1].cards);
                                            logic[player2].can_call = schnapsen_call(logic[player2].cards);
                                            io.sockets.in(g_id+r_id).emit('deal_calls');
                                        }
                                    }else{

                                        logic[player].cards[turn] = logic[player].current;
                                        socket.emit('invalid_move', {pos: turn});
                                    }
                                }
                            }else{

                                logic["whois"]++;
                                rooms[g_id][r_id].p_onturn++;
                                if(rooms[g_id][r_id].p_onturn == rooms[g_id][r_id].players.length)
                                    rooms[g_id][r_id].p_onturn = 0;
                            }
                        }

                        if(action == "call"){

                            if(logic[player].can_call[turn] && logic.whois == 0){

                                if(logic[player].score == 0){

                                    if(logic[player].cards[turn].split("")[0] == logic.adut.split("")[0])
                                        logic[player].call_score = 40;
                                    else
                                        logic[player].call_score = 20;
                                }else{

                                    if(logic[player].cards[turn].split("")[0] == logic.adut.split("")[0])
                                        logic[player].score+=40;
                                    else
                                        logic[player].score+=20;
                                }

                                send_points = true;
                                io.sockets.in(g_id+r_id).emit('show_card', {card: logic[player].cards[turn], player: player, pos: turn, king: (logic[player].cards[turn].split('')[0] + "3"), new_hand: logic.who_gets_cards, closed: logic.who_closed});
                                logic[player]["current"] = logic[player].cards[turn]; //saves the selected card
                                logic[player]["currentpos"] = turn;
                                logic[player].cards[turn] = "e0";
                                logic.main_player = player;
                                logic.who_gets_cards = "";

                                logic[player].can_call = schnapsen_call(logic[player].cards);
                                socket.emit('send_my_calls', {calls: logic[player].can_call});

                                logic["whois"]++;
                                rooms[g_id][r_id].p_onturn++;
                                if(rooms[g_id][r_id].p_onturn == rooms[g_id][r_id].players.length)
                                    rooms[g_id][r_id].p_onturn = 0;
                            }
                        }

                        if(action == "switch"){

                            if(logic.whois == 0 && logic.deck.length > 1){

                                if(logic[player].can_switch[turn]){

                                    temp_card = logic.adut;
                                    logic.adut = logic[player].cards[turn];
                                    logic[player].cards[turn] = temp_card;
                                    logic[player].can_switch[turn] = false;

                                    socket.emit('switch_adut', {card: logic[player].cards[turn], pos: turn});
                                    io.sockets.in(g_id+r_id).emit('new_adut', {card: logic.adut});

                                    logic[player].can_call = schnapsen_call(logic[player].cards);
                                    socket.emit('send_my_calls', {calls: logic[player].can_call});
                                }
                            }
                        }

                        if(action == "close"){

                            if(logic["whois"] == 0 && logic.deck.length > 1){

                                logic.who_closed = player;
                                logic.deck.splice(0,20);
                                io.sockets.in(g_id+r_id).emit('closed');
                            }
                        }

                        if(send_points){

                            io.sockets.in(g_id+r_id).emit('current_points');

                            if(logic[player1].score >= 66){

                                win = true;
                                if(logic[player2].score == 0)
                                    logic[player1].total_score += 3;
                                else if(logic[player2].score < 33)
                                    logic[player1].total_score += 2;
                                else
                                    logic[player1].total_score += 1;
                            }
                                
                            if(logic[player2].score >= 66){

                                win = true;
                                if(logic[player1].score == 0)
                                    logic[player2].total_score += 3;
                                else if(logic[player1].score < 33)
                                    logic[player2].total_score += 2;
                                else
                                    logic[player2].total_score += 1;
                            }
                        }
                    }

                    
                    if(win){//if somebody wins you cant do any logic for this room anymore

                        io.sockets.in(g_id+r_id).emit('send_total_score', {score1: logic[player1].total_score, score2: logic[player2].total_score, round: rooms[g_id][r_id].round});
                        winner = "";
                        if(logic[player1].total_score >= 7)
                            winner = player1;
                        if(logic[player2].total_score >= 7)
                            winner = player2;
                        if(winner != ""){

                            io.sockets.in(g_id+r_id).emit('add_winner', {pos: rooms[g_id][r_id].players.indexOf(winner), round: rooms[g_id][r_id].round});
                            rooms[g_id][r_id].do_logic = true;
                        }else{

                            rooms[g_id][r_id].next_round = true;
                            rooms[g_id][r_id].ingame = false;
                            rooms[g_id][r_id].round++;
                            rooms[g_id][r_id].p_onturn = rooms[g_id][r_id].round%2;
                        }
                    }

                    rooms[g_id][r_id].logic = logic;
                    io.sockets.in(g_id+r_id).emit('who_turn', {player: players[rooms[g_id][r_id].p_onturn]});
                    rooms[g_id][r_id].do_logic = false;
                }
            }
        }
    });

    socket.on('get_my_cards', function(data) {

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id))
            socket.emit('send_my_cards', {cards: rooms[g_id][r_id].logic[r_user].cards, adut: rooms[g_id][r_id].logic["adut"], begin: data.begin, end: data.end});
    });

    socket.on('get_my_card', function(data) {

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id)){

            pos = rooms[g_id][r_id].logic[r_user].currentpos;
            pos2 = 0;
            if(rooms[g_id][r_id].players[0] == r_user)
                pos2 = rooms[g_id][r_id].logic[rooms[g_id][r_id].players[1]].currentpos;
            else
                pos2 = rooms[g_id][r_id].logic[rooms[g_id][r_id].players[0]].currentpos;
            socket.emit('send_my_card', {card: rooms[g_id][r_id].logic[r_user].cards[pos], pos: pos, pos2: pos2});
        }
    });

    socket.on('get_my_calls', function(data) {

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id)){

            socket.emit('send_my_calls', {calls: rooms[g_id][r_id].logic[r_user].can_call});
        }
    });

    socket.on('get_my_switch', function(data) {

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id)){

            socket.emit('send_my_switch', {switches: rooms[g_id][r_id].logic[r_user].can_switch});
        }
    });

    socket.on('get_my_current_points', function(data){

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id)){

            socket.emit('send_my_current_points', {score: rooms[g_id][r_id].logic[r_user].score});
        }
    });

    socket.on('get_aduts', function(data){

        g_id = data.g_id;
        r_id = data.r_id;
        r_user = data.r_user;
        if(user_auth(r_user) && room_exists(g_id, r_id) && rooms[g_id][r_id].players[rooms[g_id][r_id].p_onturn] == r_user ){

            socket.emit('show_aduts');
        }
    });
});