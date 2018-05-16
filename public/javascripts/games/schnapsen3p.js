$(document).ready(function() {
    var players = [];
    var o1, o2;
    var last_p;
    var card_index = 0;
    var call_delete_index = 0;
    var url = $(location).attr('href');
    var g_id = url.split("/")[4];
    var r_id = url.split("/")[6];
    if ($.cookie('username') == null )
        $.cookie('username', "Guest3"+Math.round(Math.random()*10000));
    var r_user = "Guest3"+Math.round(Math.random()*10000);

    var paper = new ScaleRaphael("canvas",1110,600);
    var inner_w = window.innerWidth;
    var inner_h = window.innerHeight;
    

    var preloader = [];
    tarr = new Array("p", "s", "k", "a");
    for(a = 1; a <= 6; a++)
        for(b = 0; b < tarr.length; b++){
            preloader[a+""+b] = new Image();
            preloader[a+""+b].src = "/images/schnapsen/" + tarr[b]+a + ".gif";
        }
    preloader["back"] = new Image();
    preloader["back"].src = "/images/schnapsen/back.gif";
    tarr = new Array("snops", "small", "big", "twelve", "twenty-four", "pass", "dd", "confirm", "call", "shuffle");
    for(a = 0; a < tarr.length; a++){

        preloader[tarr[a]+"b_idle"] = new Image();
        preloader[tarr[a]+"b_hover"] = new Image();
        preloader[tarr[a]+"b_idle"].src   = "/images/schnapsen/" + tarr[a] + "_b_idle.png";
        preloader[tarr[a]+"b_hover"].src = "/images/schnapsen/" + tarr[a] + "_b_hover.png";
        if(a < 5){

            preloader[tarr[a]+"n_idle"] = new Image();
            preloader[tarr[a]+"n_hover"] = new Image();
            preloader[tarr[a]+"n_idle"].src  = "/images/schnapsen/" + tarr[a] + "_n_idle.png";
            preloader[tarr[a]+"n_hover"].src = "/images/schnapsen/" + tarr[a] + "_n_hover.png";
        }
    }
    preloader["past_hands"] = new Image();
    preloader["past_hands"].src = "/images/schnapsen/past_hands.png";
    preloader["marker"] = new Image();
    preloader["marker"].src = "/images/schnapsen/on-turn.png";
    preloader["bg"] = new Image();
    
    preloader["bg"].onload = function () {

    var socket = io.connect();
    var ge = [];// game elements
    var img = []; //images
    var pos = [];//position of game elements
    var fill1 = {bool: false, pos: 0};
    var fill2 = {bool: false, pos: 0};
    ge["obj"] = []; //the actualy game object are saved here so that they can be deleted, manipulated etc.
    ge["obj"]["t"] = []; //trash objects
    img["cards"] = [];//card images

    for(a = 1; a <= 6; a++){

        img.cards["p" + a] = "/images/schnapsen/p" + a + ".gif";
        img.cards["s" + a] = "/images/schnapsen/s" + a + ".gif";
        img.cards["k" + a] = "/images/schnapsen/k" + a + ".gif";
        img.cards["a" + a] = "/images/schnapsen/a" + a + ".gif";
    }
    img.cards["back"] = "/images/schnapsen/back.gif";
    img.cards["pick"] = "/images/schnapsen/pick.gif";
    img.cards["e0"] = "/images/schnapsen/e0.png";
    img["marker"] = "/images/schnapsen/on-turn.png";
    img["marker2"] = "/images/schnapsen/your-turn.png";
    img["button"] = [];
    img["button"]["past_hands"] = "/images/schnapsen/past_hands.png";
    tarr = new Array("snops", "small", "big", "twelve", "twenty-four", "pass", "dd", "confirm", "call", "shuffle");
    for(a = 0; a < tarr.length; a++){

        img.button[tarr[a]+"b_idle"]  = "/images/schnapsen/" + tarr[a] + "_b_idle.png";
        img.button[tarr[a]+"b_hover"] = "/images/schnapsen/" + tarr[a] + "_b_hover.png";
        if(a < 5){

            img.button[tarr[a]+"n_idle"]  = "/images/schnapsen/" + tarr[a] + "_n_idle.png";
            img.button[tarr[a]+"n_hover"] = "/images/schnapsen/" + tarr[a] + "_n_hover.png";
        }
    }

    ge.obj["call_button"] = [];
    pos["deck1"] = {x: 760, y: 200, sx: 105, sy: 165};
    pos["deck2"] = {x: 760, y: 200, sx: 105, sy: 165};
    pos["adut"] = {x: 785, y: 425, sx: 105, sy: 165};
    
    ge.obj["main"] = paper.image("/images/schnapsen/bg.jpg", 0, 0, 900, 600);
    ge.obj["score"] = paper.rect(910, 0, 200, 600, 10).attr({

        "stroke-width": 1,
        "stroke": "#b2b9c2",
        "fill": "#dde4eb"
    });
    ge.obj["past_hands"] = [];
    inner_w = window.innerWidth-100;
    inner_h = window.innerHeight;
    scale = inner_w/1120;
    if(scale > 1.5)
        scale = 1.5;
    paper.scaleAll(scale);
    $(window).resize(function() {

        inner_w = window.innerWidth-100;
        inner_h = window.innerHeight;
        scale = inner_w/1120;
        if(scale > 1.5)
            scale = 1.5;
        paper.scaleAll(scale);
    });

    socket.on('connect', function() {

        socket.emit('join_room', {
            r_id: r_id, 
            g_id: g_id, 
            r_user: r_user
        });
    });

    ge["obj"]["points"] = paper.text(920, 100, "Current score: 0").attr({ "font-size": 14, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
    paper.rect(920, 15, 170, 1); 
    paper.rect(920, 85, 170, 1); 
    paper.rect(960, 120, 1, 200); 
    paper.rect(1030, 120, 1, 200);

    socket.on('send_total_score', function(data){

        paper.text(920, 140+20*data.round, data.score1).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
        paper.text(986, 140+20*data.round, data.score2).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
        paper.text(1052, 140+20*data.round, data.score3).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
    });

    socket.on('add_winner', function(data){

        for(a = 0; a < data.pos.length; a++)
            paper.text(920+66*data.pos[a], 140+20*(data.round+1), "WIN").attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
    });
    socket.on('player_change', function(data){

        players = data.players;
        for ( a = 0; a < 3; a++){
            if(ge["obj"]["p1"+a] == undefined)
                ge["obj"]["p1"+a] =  paper.text(920, 30+a*20, "Waiting for player").attr({ "font-size": 14, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
            else
                ge["obj"]["p1"+a].attr("text", "Waiting for player");
            if(ge["obj"]["p2"+a] == undefined)
                ge["obj"]["p2"+a] =  paper.text(920+a*66, 120, "Waiting").attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
            else
                ge["obj"]["p2"+a].attr("text", "Waiting");
        }
        for ( a = 0; a < players.length; a++){

            ge["obj"]["p1"+a].attr("text", players[a]);
            ge["obj"]["p2"+a].attr("text", players[a]);
        }
    });

    //draws the two deck cards
    paper.image(img.cards.back, pos.deck1.x,pos.deck1.y, pos.deck1.sx, pos.deck1.sy).transform("r30");
    paper.image(img.cards.back, pos.deck2.x,pos.deck2.y, pos.deck2.sx, pos.deck2.sy);

    ge.obj["shuffle"] = paper.image(img.button.shuffleb_idle, pos.deck2.x, pos.deck2.y + 65, 105, 34).transform("s0.8").click(function () {
            
            socket.emit('send_move', {
                r_id: r_id, 
                g_id: g_id, 
                r_user: r_user,
                turn: "start",
                action: "start"
            })

        }).hover(function () {

                this.attr({src: img.button.shuffleb_hover});
            },function() {

                this.attr({src: img.button.shuffleb_idle});
        });

    socket.on('start', function(data){

        p_onturn = data.p_onturn;
        if(data.next_round){

            for(a = 0; a < 6; a++){

                for (b = 0; b < 3; b++){

                    if(ge.obj[players[b]+"_c"+a] != undefined)
                        ge.obj[players[b]+"_c"+a].remove();
                }
                if(ge.obj["adut"+a] != undefined)
                    ge.obj["adut"+a].remove();
                if(ge.obj["call_button"][a+""] != undefined)
                    ge.obj["call_button"][a+""].remove();
            }
            if(ge.obj["adut"] != undefined)
                ge.obj["adut"].remove();
            ge.obj["who_what_play"].remove();
            for(a = 0; a < ge.obj.past_hands.length; a++)
                    ge.obj.past_hands[a].remove();
            ge.obj.past_hands.splice(0,100);
            for(a = 0; a < 3; a++)
                if(ge.obj[players[a]+"_call_king"] != undefined)
                    ge.obj[players[a]+"_call_king"].remove();
            ge.obj["who_what_play"].remove();
            delete ge.obj["who_what_play"];
            old_cards.splice(0,100);
            fill1 = {bool: false, pos: 0};
            fill2 = {bool: false, pos: 0};
        }else{

            if(players[p_onturn] == r_user){

                o1 = players[1];
                o2 = players[2];
                ge.obj["marker"] = paper.image(img["marker"], 380, 440, 93, 59);
                ge.obj["marker"].transform("270");
            }else if(players[(p_onturn + 1)%3] == r_user){

                o1 = players[2];
                o2 = players[0];
                ge.obj["marker"] = paper.image(img["marker"], 50, 270, 93, 59);
            }else if(players[(p_onturn + 2)%3] == r_user){

                o1 = players[0];
                o2 = players[1];
                ge.obj["marker"] = paper.image(img["marker"], 290, 70, 93, 59);
                ge.obj["marker"].transform("90");
            }

            pos[r_user] = []; //player card positions
            pos[o1] = [];
            pos[o2] = [];
            pos[r_user]["marker"] = {x: 380, y: 440, r: 0};
            pos[o1]["marker"] = {x: 50, y: 270, r: 90};
            pos[o2]["marker"] = {x: 290, y: 70, r: 180};
            pos[r_user]["out"] = {x: 420, y: 240, r: -45};
            pos[o1]["out"] = {x: 305, y: 195, r: 90};
            pos[o2]["out"] = {x: 420, y: 140, r: 45};
            pos[r_user]["call_king"] = {x: 450, y: 260, r: -45};
            pos[o1]["call_king"] = {x: 270, y: 195, r: -90};
            pos[o2]["call_king"] = {x: 450, y: 120, r: 45};
            for(a = 0; a < 6; a++){

                pos[r_user][a+""] = {x: 100+a*110, y: 510, sx: 105, sy: 165, r: 0};//generates the position of the player cards
                pos[o1][a+""] = {x: -80, y: 100+a*50, sx: 105, sy: 165, r: 90}; //opponent1 positions
                pos[o2][a+""] = {x: 275+a*50, y: -100, sx: 105, sy: 165, r: 0}; //opponent 2 positions
            }
    
            paper.image(img.button.past_hands, 0, 490, 35, 100).hover(function () {

                    for(a = 0; a < ge.obj.past_hands.length; a++){

                        ge.obj.past_hands[a].animate({x: 100+((a%3)*50), y: 30+(Math.floor(a/3)*120)},300,">");
                        ge.obj.past_hands[a].toFront();
                    }
                },function() {

                    for(a = 0; a < ge.obj.past_hands.length; a++)
                        ge.obj.past_hands[a].animate({x: -300, y: 100},300,">");
                });
        }
        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: 0, end: 3});
        socket.emit('get_aduts', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    var old_cards = [];
    socket.on('show_card', function(data){

        if(data.new_hand.length > 0){

            for(a = 0; a < 3; a++)
                if(ge.obj[players[a]+"_call_king"] != undefined)
                    ge.obj[players[a]+"_call_king"].remove();
            for(a = 0; a < data.new_hand.length; a++)
                if(data.new_hand[a] == r_user)
                    for(b = 0; b < old_cards.length; b++)
                        ge.obj.past_hands.push(paper.image(ge.obj[old_cards[b]].attr("src"), -300, 100, 75, 115).transform("s1"));
            for(a = 0; a < old_cards.length; a++)
                ge.obj[old_cards[a]].remove();
            old_cards.splice(0,10);
        }

        if(data.king != undefined){

            ge.obj[data.player+"_call_king"] = paper.image(img.cards[data.king], pos[data.player].call_king.x, pos[data.player].call_king.y, 105, 165).transform("r" + pos[data.player].call_king.r);
            ge.obj[data.player+"_c"+data.pos].toFront();
            ge.obj[data.player+"_call_king"].attr({"opacity": 0.6})
        }
        old_cards.push(data.player+"_c"+data.pos);
        if(data.player != r_user)
            ge.obj[data.player+"_c"+data.pos].animate({x: pos[data.player].out.x, y: pos[data.player].out.y, transform: "r" + pos[data.player].out.r}, 300, "linear");
        else
            ge.obj[data.player+"_c"+data.pos].animate({x: pos[data.player].out.x, y: pos[data.player].out.y, transform: "s1r" + pos[data.player].out.r}, 300, "linear");
        ge.obj[data.player+"_c"+data.pos].attr({src: img.cards[data.card]});
        ge.obj[data.player+"_c"+data.pos].toFront();
        ge.obj[data.player+"_c"+data.pos].node.setAttribute("pointer-events", "none");
    });

    socket.on('show_small_card', function(data){

        if(data.player != r_user)
            ge.obj[data.player+"_c"+data.pos].animate({x: 250+data.whois*120, y: 100+data.num*40, transform: "r0"}, 300, "linear");
        else
            ge.obj[data.player+"_c"+data.pos].animate({x: 250+data.whois*120, y: 100+data.num*40, transform: "s1r0"}, 300, "linear");
        ge.obj[data.player+"_c"+data.pos].attr({src: img.cards[data.card]});
        ge.obj[data.player+"_c"+data.pos].toFront();
        ge.obj[data.player+"_c"+data.pos].node.setAttribute("pointer-events", "none");
    });

    socket.on('show_24', function(data){

        for(a = 0; a < 6; a++){
            ge.obj[data.player+"_c"+a].animate({x: 150+a*90, y: 300, transform: "s1r0"}, 300, "linear");
            ge.obj[data.player+"_c"+a].attr({src: img.cards[data.card]});
            ge.obj[data.player+"_c"+a].toFront();
            ge.obj[data.player+"_c"+a].node.setAttribute("pointer-events", "none");
        }
    });

    socket.on('show_aduts', function(){

        tarr = [];
        tarr.push("s6");
        tarr.push("k6");
        tarr.push("a6");
        tarr.push("p6");
        tarr.push("pick");
        for(a = 0; a < 4; a++){

            if(ge.obj["adut"+a] != undefined)
                ge.obj["adut"+a].remove();
            ge.obj["adut"+a] = paper.image(img.cards[tarr[a]], -1000, -1000, 105, 165)
                .data("pos", tarr[a])
                .data("index", a)
                .click(function () {

                    socket.emit('send_move', {
                        r_id: r_id, 
                        g_id: g_id, 
                        r_user: r_user,
                        turn: this.data("pos"),
                        action: "card"
                    });
                    for(b = 0; b < 4; b++){

                        if(this.data("index") != b)
                            ge.obj["adut"+b].remove();
                        else{

                            ge.obj["adut"+b].node.setAttribute("pointer-events", "none");
                            anim = Raphael.animation({x: pos.adut.x, y: pos.adut.y}, 400, "linear");
                            ge.obj["adut"+b].animate(anim.delay(100));
                        }
                    }
                }).hover(function () {

                    this.toFront();
                    this.animate({ transform: 's1.18'}, 50, 'linear');
                },function() {

                    this.animate({ transform: 's1'}, 50, 'linear');
                });
                anim = Raphael.animation({x: 180+a*110, y: 160}, 1, "linear");
                ge.obj["adut"+a].animate(anim.delay(2700));
        }
    });

    
    socket.on('show_adut', function(data){

        if(data.pos == 4 && data.player == r_user)
            ge.obj["adut4"].attr({src: img.cards[data.card]});
        if(data.player != r_user){

            ge.obj["adut"] = paper.image(img.cards[data.card], pos.adut.x, pos.adut.y, 105, 165);
        }
    });

    socket.on('deal_cards', function(data){

        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: data.begin, end: data.end});
    });

    socket.on('send_my_cards', function(data){

        tarr = pos[r_user];
        for(a = data.begin; a < data.end; a++){

            ge.obj[r_user+"_c"+a] = paper.image(img.cards[data.cards[a]], pos.deck2.x, pos.deck2.y, pos.deck2.sx, pos.deck2.sy)
            .data("pos", a)
            .click(function () {

                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: this.data("pos"),
                    action: "card"
                });
            }).hover(function () {

                this.toFront();
                this.animate({ transform: 's1.18'}, 50, 'linear');
            },function() {

                this.animate({ transform: 's1'}, 50, 'linear');
            });
            delay = 300;
            anim1 = Raphael.animation({x: pos[r_user][a+""].x , y: pos[r_user][a+""].y, transform: "r" + (pos[r_user][a+""].r)}, delay, ">");
            ge.obj[o1+"_c"+a] = paper.image(img.cards.back, pos.deck2.x, pos.deck2.y, pos.deck2.sx, pos.deck2.sy);
            anim2 = Raphael.animation({x: pos[o1][a+""].x , y: pos[o1][a+""].y, transform: "r" + (pos[o1][a+""].r)}, delay, ">");
            ge.obj[o2+"_c"+a] = paper.image(img.cards.back, pos.deck2.x, pos.deck2.y, pos.deck2.sx, pos.deck2.sy);
            anim3 = Raphael.animation({x: pos[o2][a+""].x , y: pos[o2][a+""].y, transform: "r" + (pos[o2][a+""].r)}, delay, ">");
            ge.obj[r_user+"_c"+a].animate(anim1.delay((a%3)*(delay*3)+delay));
            ge.obj[o1+"_c"+a].animate(anim2.delay((a%3)*(delay*3)+delay*2));
            ge.obj[o2+"_c"+a].animate(anim3.delay((a%3)*(delay*3)+delay*3));
        }
    });

     socket.on('deal_card', function(data){

        socket.emit('get_my_card', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('send_my_card', function(data){

        tarr = pos[r_user];
        x = tarr[data.pos].x;
        y = tarr[data.pos].y;
        animate = false;
        if(fill1.pos == data.pos){

            x = 350;
            y = 300;
            animate = true;
            fill1.pos = -1;
        }
        else if(fill2.pos == data.pos){

            x = 460;
            y = 300;
            animate = true;
            fill2.pos = -1;
        }
        ge.obj[r_user+"_c"+data.pos].attr({src: img.cards[data.card]});
        if(animate){
            anim = Raphael.animation({x: pos[r_user][data.pos+""].x , y: pos[r_user][data.pos+""].y}, 300, "linear");
            ge.obj[r_user+"_c"+data.pos].animate(anim.delay(300));
        }
        for(a = 0; a < 6; a++)
             ge.obj[r_user+"_c"+a].toFront();
    });

    socket.on('send_my_calls', function(data){

        for(a = 0; a < 6; a++){

            if(ge.obj["call_button"][a+""] != undefined)
                ge.obj["call_button"][a+""].remove();
            if(data.calls[a]){

                ge.obj["call_button"][a+""] = paper.image(img.button.callb_idle, 100+a*110, 475, 105, 34).transform("s0.8")
                .data("pos", a)
                .data("index", a)
                .click(function () {

                    socket.emit('send_move', {
                        r_id: r_id, 
                        g_id: g_id, 
                        r_user: r_user,
                        turn: this.data("pos"),
                        action: "call"
                    });
                }).hover(function () {

                    this.attr({src: img.button.callb_hover});
                },function() {

                    this.attr({src: img.button.callb_idle});
                });
            }
        }
    });

    socket.on('switch_state', function(data){

        if(data.player == r_user){

            if(data.whois == 0)
                ge.obj["switch_text"] = paper.text(430, 220, "Choose a maximum of 2 cards you want to switch.").attr({ "font-size": 16, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#3a691e"});
            else
                ge.obj["switch_text"] = paper.text(430, 220, "Choose a maximum of 2 cards you want to switch.\nYou will have to select a play if you decide to switch cards.").attr({ "font-size": 16, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#3a691e"});

            ge.obj["switch_button"] = paper.image(img.button.confirmb_idle, 380, 250, 105, 34)
            .click(function () {
                
                    socket.emit('send_move', {
                        r_id: r_id, 
                        g_id: g_id, 
                        r_user: r_user,
                        turn: "finish-select",
                        action: "finish-select"
                    });
                    ge.obj["switch_button"].remove();
                    ge.obj["switch_text"].remove();
                }).hover(function () {

                    this.attr({src: img.button.confirmb_hover});
                },function() {

                    this.attr({src: img.button.confirmb_idle});
                });
            fill1.bool = false;
            fill2.bool = false;
        }
    });

    socket.on('select_switch', function(data){

        if(!fill1.bool){

            fill1.bool = true;
            fill1.pos = data.pos;
            ge.obj[r_user+"_c"+data.pos].animate({x: 320, y: 300}, 250, "linear");
        }
        else if(!fill2.bool){

            fill2.bool = true;
            fill2.pos = data.pos;
            ge.obj[r_user+"_c"+data.pos].animate({x: 430, y: 300}, 250, "linear");
        }
    });

    socket.on('deselect_switch', function(data){

        if(fill1.pos == data.pos)
            fill1.bool = false;
        if(fill2.pos == data.pos)
            fill2.bool = false;
        ge.obj[r_user+"_c"+data.pos].animate({x: pos[r_user][data.pos+""].x , y: pos[r_user][data.pos+""].y}, 250, "linear");
    });

    socket.on('announce_plays', function(data){

        tarr = new Array("Normal (1x)", "Schnapsen (6)", "Small (7)", "Big (9)", "Twelve (12)", "Twenty four (24)");
        if(ge.obj["who_what_play"] == undefined)
            ge.obj["who_what_play"] = paper.text(430, 130, data.whoplay + "\n" + tarr[data.play]).attr({ "font-size": 36, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#62b034"});
        else{

            tarr2 = new Array(3,6,7,9,12,24);
            tarr = new Array("Normal ", "Schnapsen ", "Small ", "Big ", "Twelve ", "Twenty four ");
            num = 0;
            if(tarr2[data.play]*data.m > 25)
                num = 25;
            else
                num = tarr2[data.play]*data.m;
            if(data.play == 5)
                ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "(24)");
            else if(data.play > 0 )
                ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "(" + num + ")");
            else
                ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "("+data.m+"x)");
        }
    });

    socket.on('what_to_play_state', function(data){

        delay = 100;
        counter = 0;
        anim = Raphael.animation({transform: "s0.8"}, delay, "linear");
        if(data.player == r_user){

            tarr = new Array();
            if(data.play <= 0 && (data.m == 1 || data.whois == 100))
                tarr.push("snops");
            if(data.play <= 1 && (data.m == 1 || data.whois == 100))
                tarr.push("small");
            if(data.play <= 2 && (data.m == 1 || data.whois == 100))
                tarr.push("big");
            if(data.play <= 3 && (data.m == 1 || data.whois == 100))
                tarr.push("twelve");
            if(data.has_24)
                tarr.push("twenty-four");
            for(a = 0; a < tarr.length; a++){

                ge.obj["playn"+a] = paper.image(img.button[tarr[a]+"n_idle"], 110 + 65*(5-tarr.length) + a*133, 220, 129, 49).transform("s0");
                ge.obj["playb"+a] = paper.image(img.button[tarr[a]+"b_idle"], 110 + 65*(5-tarr.length) + a*133, 170, 129, 34)
                    .transform("s0")
                    .data("pos", tarr[a])
                    .data("index", a)
                    .click(function () {

                        socket.emit('send_move', {
                            r_id: r_id, 
                            g_id: g_id, 
                            r_user: r_user,
                            turn: "play_selected",
                            action: this.data("pos")
                        });
                        for(b = 0; b < 5; b++){

                            if(ge.obj["playn"+b] != undefined)
                                ge.obj["playn"+b].remove();
                            if(ge.obj["playb"+b] != undefined)
                                ge.obj["playb"+b].remove();
                        }
                        ge.obj["playbpass"].remove();
                        ge.obj["playbdd"].remove();
                    }).hover(function () {

                        this.attr({src: img.button[this.data("pos")+"b_hover"]});
                        ge.obj["playn"+this.data("index")].attr({src: img.button[this.data("pos")+"n_hover"]});
                    },function () {

                        this.attr({src: img.button[this.data("pos")+"b_idle"]});
                        ge.obj["playn"+this.data("index")].attr({src: img.button[this.data("pos")+"n_idle"]});
                    });
                ge.obj["playn"+a].animate(anim.delay(delay*a));
                ge.obj["playb"+a].animate(anim.delay(delay*a));
                counter++;
            }
            if((data.m == 1 && data.pass == 0) || (data.m == 2 && data.whoplay == r_user) || data.whois == 0 || data.whois == 100){

                ge.obj["playbpass"] = paper.image(img.button["passb_idle"], 270, 310, 168, 45)
                .transform("s0")
                .click(function () {

                    socket.emit('send_move', {
                        r_id: r_id, 
                        g_id: g_id, 
                        r_user: r_user,
                        turn: "play_selected",
                        action: "pass"
                    });
                    for(b = 0; b < 5; b++){
                        if(ge.obj["playn"+b] != undefined)
                            ge.obj["playn"+b].remove();
                        if(ge.obj["playb"+b] != undefined)
                            ge.obj["playb"+b].remove();
                    }
                    this.remove();
                    if(ge.obj["playbdd"] != undefined)
                        ge.obj["playbdd"].remove();
                }).hover(function () {

                    this.attr({src: img.button["passb_hover"]});
                },function () {

                    this.attr({src: img.button["passb_idle"]});
                });
                ge.obj["playbpass"].animate(anim.delay(delay*counter));
                counter++;
                if(data.whois != 0 && data.whois != 100){

                    ge.obj["playbdd"] = paper.image(img.button["ddb_idle"], 470, 310, 168, 45)
                    .transform("s0")
                    .click(function () {

                        socket.emit('send_move', {
                            r_id: r_id, 
                            g_id: g_id, 
                            r_user: r_user,
                            turn: "play_selected",
                            action: "double"
                        });
                        for(b = 0; b < 5; b++){
                            if(ge.obj["playn"+b] != undefined)
                                ge.obj["playn"+b].remove();
                            if(ge.obj["playb"+b] != undefined)
                                ge.obj["playb"+b].remove();
                        }
                        if(ge.obj["playbpass"] != undefined)
                            ge.obj["playbpass"].remove();
                        this.remove();
                    }).hover(function () {

                        this.attr({src: img.button["ddb_hover"]});
                    },function () {

                        this.attr({src: img.button["ddb_idle"]});
                    });
                    ge.obj["playbdd"].animate(anim.delay(delay*counter));
                }
            }
        }
    });

    socket.on('play_state', function(data){

        tarr2 = new Array(3,6,7,9,12);
        tarr = new Array("Normal ", "Schnapsen ", "Small ", "Big ", "Twelve ", "Twenty four ");
        num;
        if(tarr2[data.play]*data.m > 25)
            num = 25;
        else
            num = tarr2[data.play]*data.m;
        if(data.play == 5)
            ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "(24)");
        else if(data.play > 0 )
            ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "(" + num + ")");
        else
            ge.obj["who_what_play"].attr("text" , data.whoplay + "\n" + tarr[data.play] + "("+data.m+"x)");
        anim = Raphael.animation({x: 840, y: 25, transform: "s0.5"}, 800, "linear");
        ge.obj["who_what_play"].animate(anim.delay(300));
        if(data.play <= 1)
            socket.emit('get_my_calls', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('invalid_move', function(data){

        anim = Raphael.animation({x: pos[r_user][data.pos+""].x + 5, y: pos[r_user][data.pos+""].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim);
        anim = Raphael.animation({x: pos[r_user][data.pos+""].x - 10, y: pos[r_user][data.pos+""].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim.delay(50));
        anim = Raphael.animation({x: pos[r_user][data.pos+""].x, y: pos[r_user][data.pos+""].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim.delay(100));
    });
    
    socket.on('current_points', function(){

        socket.emit('get_my_current_points', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('send_my_current_points', function(data){

        ge["obj"].points.attr("text", "Current score: " + data.score);
    });

    socket.on('who_turn', function(data){

        if(last_p != data.player){

            last_p = data.player;
            ge.obj.marker.animate({x: pos[data.player].marker.x, y: pos[data.player].marker.y, transform: "r" + (pos[data.player].marker.r)}, 600, "linear");
        }
    });
    };
    preloader["bg"].src ="/images/schnapsen/bg.jpg"
});
