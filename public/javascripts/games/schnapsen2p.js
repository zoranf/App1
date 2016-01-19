$(document).ready(function() {
    var players = [];
    var o1, o2;
    var last_p = "";
    var url = $(location).attr('href');
    var g_id = url.split("/")[4];
    var r_id = url.split("/")[6];
    if ($.cookie('username') == null )
        $.cookie('username', "Guest"+Math.round(Math.random()*10000));
    var r_user = "Guest"+Math.round(Math.random()*10000);
    var first_call = true;
    var first_switch = true;
    var last_card = false;

    var paper = new ScaleRaphael("canvas",1110,600);
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

    var preloader = [];
    tarr = new Array("p", "s", "k", "a");
    for(a = 1; a <= 6; a++)
        for(b = 0; b < tarr.length; b++){
            preloader[tarr[b]+""+a] = new Image();
            preloader[tarr[b]+""+a].src = "/images/schnapsen/" + tarr[b]+a + ".gif";
        }
    preloader["back"] = new Image();
    preloader["back"].src = "/images/schnapsen/back.gif";
    tarr = new Array("call", "shuffle", "switch", "close");
    for(a = 0; a < tarr.length; a++){

        preloader[tarr[a]+"b_idle"] = new Image();
        preloader[tarr[a]+"b_hover"] = new Image();
        preloader[tarr[a]+"b_idle"].src   = "/images/schnapsen/" + tarr[a] + "_b_idle.png";
        preloader[tarr[a]+"b_hover"].src = "/images/schnapsen/" + tarr[a] + "_b_hover.png";
    }
    preloader["past"] = new Image();
    preloader["past"].src = "/images/schnapsen/past_hands.png";
    preloader["marker"] = new Image();
    preloader["marker"].src = "/images/schnapsen/on-turn.png";
    preloader["bg"] = new Image();

    preloader["bg"].onload = function () {

    var socket = io.connect();

    socket.on('connect', function() {

        socket.emit('join_room', {
            r_id: r_id, 
            g_id: g_id, 
            r_user: r_user
        });
    });

    var ge = [];// game elements
    ge["obj"] = [];

    ge.obj["bg"] = paper.image(preloader.bg.src, 0, 0, 900, 600);
    ge.obj["d1"] = paper.image(preloader.back.src, 760, 220, 105,165).transform("r30");
    ge.obj["d2"] = paper.image(preloader.back.src, 760, 220, 105, 165);
    ge.obj["shuffle"] = paper.image(preloader.shuffleb_idle.src, 760, 280, 105, 34).transform("s0.8")
    .click(function () {
    
        socket.emit('send_move', {
            r_id: r_id, 
            g_id: g_id, 
            r_user: r_user,
            turn: "start",
            action: "start"
        })

    }).hover(function () {

            this.attr({src: preloader.shuffleb_hover.src});
        },function() {

            this.attr({src: preloader.shuffleb_idle.src});
    });
    ge.obj["close"] = paper.image(preloader.closeb_idle.src, 760, 280, 105, 34).transform("s0").hide()
    .click(function () {
    
        socket.emit('send_move', {
            r_id: r_id, 
            g_id: g_id, 
            r_user: r_user,
            turn: "close",
            action: "close"
        })

    }).hover(function () {

            this.attr({src: preloader.closeb_hover.src});
        },function() {

            this.attr({src: preloader.closeb_idle.src});
    });
    ge.obj["score"] = paper.rect(910, 0, 200, 600, 10).attr({

        "stroke-width": 1,
        "stroke": "#b2b9c2",
        "fill": "#dde4eb"
    });

    socket.on('start', function(data){

        p_onturn = data.p_onturn;
        ge.obj.shuffle.hide();
        
        if(data.next_round){

            for(a = 0; a < 5; a++){

                ge.obj[r_user+"_c"+a].remove();
                ge.obj[o1+"_c"+a].remove();
                ge.obj["switch"+a].remove();
                ge.obj["call"+a].remove();
            }

            ge.obj[r_user+"_out"].remove();
            ge.obj[o1+"_out"].remove();
            ge.obj[r_user+"_king"].remove();
            ge.obj[o1+"_king"].remove();
            ge.obj["adut"].remove();
            ge.obj["marker"].remove();
            first_call = true;
            first_switch = true;
            last_card = false;
        }else{

            user = r_user;
            o1 = "";
            if(r_user == players[0])
                o1 = players[1];
            else
                o1 = players[0];

            ge[r_user] = [];
            ge[o1] = [];
        
            for(a = 0; a < 5; a++){// positions

                ge[r_user][a+"_pos"] = {x: 150+a*110, y: 510, r: 0};//generates the position of the player cards
                ge[o1][a+"_pos"] = {x: 150+a*110, y: -50, r: 0}; //opponent1 positions
                ge.obj["button"+a+"_pos"] = {x: 150+a*110, y: 475, r: 0};
            }
            ge[r_user]["out_pos"] = {x: 300, y: 230, r: 0};
            ge[o1]["out_pos"] = {x: 410, y: 230, r: 0};
            ge[r_user]["king_pos"] = {x: 260, y: 230, r: 0};
            ge[o1]["king_pos"] = {x: 450, y: 230, r: 0};
            ge[r_user]["marker_pos"] = {x: 320, y: 430, sx: 93, sy: 59, r: 0};
            ge[o1]["marker_pos"] = {x: 435, y: 125, sx: 93, sy: 59, r: 180};

            ge.obj["past_pos"] = {x: 0, y: 490, sx: 35, sy: 100, r: 0};
            ge.obj["adut_pos"] = {x: 700, y: 220, r: 90};
            ge.obj["deck_pos"] = {x: 760, y: 220};
        }
        for(a = 0; a < 5; a++){//game elements

            ge.obj[r_user+"_c"+a] = paper.image("", ge.obj.deck_pos.x, ge.obj.deck_pos.y, 105, 165).data("pos", a)
            .click(function () {

                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: this.data("pos"),
                    action: "card"
                });
            }).hover(function () {

                this.animate({ transform: 's1.18'}, 50, 'linear');
                this.toFront();
            },function() {

                this.animate({ transform: 's1'}, 50, 'linear');
            });
            ge.obj[o1+"_c"+a] =  paper.image("", ge.obj.deck_pos.x, ge.obj.deck_pos.y, 105, 165);
            ge.obj["switch"+a] = paper.image(preloader.switchb_idle.src, ge.obj["button"+a+"_pos"].x, ge.obj["button"+a+"_pos"].y, 105, 34).hide().data("pos", a).transform("s0.0")
            .click(function () {

                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: this.data("pos"),
                    action: "switch"
                });
            }).hover(function () {

                this.toFront();
                this.attr({src: preloader.switchb_hover.src})
            },function() {

                this.attr({src: preloader.switchb_idle.src})
            });
            ge.obj["call"+a] = paper.image(preloader["callb_idle"].src, ge.obj["button"+a+"_pos"].x, ge.obj["button"+a+"_pos"].y, 105, 34).hide().data("pos", a).transform("s0.0")
            .click(function () {

                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: this.data("pos"),
                    action: "call"
                });
            }).hover(function () {

                this.toFront();
                this.attr({src: preloader.callb_hover.src})
            },function() {

                this.attr({src: preloader.callb_idle.src})
            });
        }

        ge.obj[r_user+"_out"] = paper.image("", 0, 0, 105, 165).hide();
        ge.obj[o1+"_out"] = paper.image("", 0, 0, 105, 165).hide();
        ge.obj[r_user+"_king"] = paper.image("", ge[r_user].king_pos.x, ge[r_user].king_pos.y, 105, 165).hide();
        ge.obj[o1+"_king"] = paper.image("", ge[o1].king_pos.x, ge[o1].king_pos.y, 105, 165).hide();
        ge.obj["adut"] = paper.image("", ge.obj.deck_pos.x, ge.obj.deck_pos.y, 105, 165);
        ge.obj.adut.toBack();
        ge.obj.bg.toBack();
        ge.obj["marker"] = paper.image(preloader.marker.src, ge[r_user].marker_pos.x, ge[r_user].marker_pos.y, ge[r_user].marker_pos.sx, ge[r_user].marker_pos.sy).transform("r"+ge[r_user].marker_pos.r);
        ge.obj["past_hands"] = [];
        if(!data.next_round){

            ge.obj["past"] = paper.image(preloader.past.src, ge.obj.past_pos.x, ge.obj.past_pos.y, ge.obj.past_pos.sx, ge.obj.past_pos.sy).transform("r"+ge.obj.past_pos.r)
            .hover(function () {

                for(a = 0; a < ge.obj.past_hands.length; a++){

                    ge.obj.past_hands[a].animate({x: 100+((a%4)*50+Math.floor((a%4)/2)*50), y: 50+(Math.floor(a/4)*120)},300,">");
                    ge.obj.past_hands[a].toFront();
                }
            },function() {

                for(a = 0; a < ge.obj.past_hands.length; a++)
                    ge.obj.past_hands[a].animate({x: -300, y: 100},300,">");
            });
        }
        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: 0, end: 5});
    });

    ge.obj["points"] = paper.text(920, 80, "Current score: 0").attr({ "font-size": 14, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
    paper.rect(920, 15, 170, 1); 
    paper.rect(920, 60, 170, 1); 
    paper.rect(990, 120, 1, 200); 
    ge.obj["total_points"] = [];

    socket.on('player_change', function(data){

        players = data.players;
        for ( a = 0; a < 2; a++){
            if(ge.obj["p1"+a] == undefined)
                ge.obj["p1"+a] =  paper.text(920, 30+a*20, "Waiting for player").attr({ "font-size": 14, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
            else
                ge.obj["p1"+a].attr("text", "Waiting for player");
            if(ge.obj["p2"+a] == undefined)
                ge.obj["p2"+a] =  paper.text(920+a*100, 120, "Waiting").attr({ "font-size": 12, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
            else
                ge.obj["p2"+a].attr("text", "Waiting");
        }
        for ( a = 0; a < players.length; a++){

            ge.obj["p1"+a].attr("text", players[a]);
            ge.obj["p2"+a].attr("text", players[a]);
        }
    });



    socket.on('send_total_score', function(data){

        ge.obj["total_points"].push(paper.text(920, 140+20*data.round, data.score1).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"}));
        ge.obj["total_points"].push(paper.text(1020, 140+20*data.round, data.score2).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"}));
        ge.obj.close.hide();
        ge.obj.shuffle.show();
        ge.obj.d2.show();
        ge.obj.shuffle.toFront();
    });

    socket.on('add_winner', function(data){

        ge.obj["total_points"].push(paper.text(920+100*data.pos, 140+20*(data.round+1), "WIN").attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"}));
    });
    socket.on('deal_cards', function(data){

        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: data.begin, end: data.end});
    });

    socket.on('send_my_cards', function(data){

        for(a = data.begin; a < data.end; a++){

            ge.obj[r_user+"_c"+a].attr({src: preloader[data.cards[a]].src})
            delay = 300;
            anim1 = Raphael.animation({x: ge[r_user][a+"_pos"].x , y: ge[r_user][a+"_pos"].y}, delay, "linear");
            ge.obj[o1+"_c"+a].attr({src: preloader.back.src});
            anim2 = Raphael.animation({x: ge[o1][a+"_pos"].x , y: ge[o1][a+"_pos"].y}, delay, ">");
            ge.obj[r_user+"_c"+a].animate(anim1.delay(a*delay*2+delay));
            ge.obj[o1+"_c"+a].animate(anim2.delay(a*delay*2+delay*2));
        }
        ge.obj.adut.attr({src: preloader[data.adut].src});
        anim1 = Raphael.animation({x: ge.obj.adut_pos.x , y: ge.obj.adut_pos.y, transform: "r90"}, delay, "linear");
        ge.obj.adut.animate(anim1.delay(delay*11));
        anim1 = Raphael.animation({transform: "s0.8"}, delay, "linear");
        ge.obj.close.animate(anim1.delay(delay*11));
        ge.obj.close.show();
        ge.obj.close.toFront();
        socket.emit('get_my_calls', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
        socket.emit('get_my_switch', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

     socket.on('deal_card', function(){

        socket.emit('get_my_card', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('deal_calls', function(){

        socket.emit('get_my_calls', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
        socket.emit('get_my_switch', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('send_my_card', function(data){

        ge.obj[r_user+"_c"+data.pos].attr({x: ge.obj.deck_pos.x, y: ge.obj.deck_pos.y});
        ge.obj[r_user+"_c"+data.pos].attr({src: preloader[data.card].src});
        
        delay = 300;
        anim1 = Raphael.animation({x: ge[r_user][data.pos+"_pos"].x , y: ge[r_user][data.pos+"_pos"].y}, delay, "linear");
        anim2 = Raphael.animation({x: ge[o1][data.pos2+"_pos"].x , y: ge[o1][data.pos2+"_pos"].y}, delay, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim1.delay(delay));
        ge.obj[o1+"_c"+data.pos2].animate(anim2.delay(delay*2));
        ge.obj[r_user+"_c"+data.pos].show();
        ge.obj[o1+"_c"+data.pos2].show();
    });

   
    socket.on('send_my_calls', function(data){

        for(a = 0; a < 5; a++){

            if(data.calls[a]){

                anim = Raphael.animation({transform: 's0.8'}, 150, 'linear');
                delay = 0;
                if(first_call)
                    delay = 300;
                ge.obj["call"+a].show().animate(anim.delay(delay*11));
            }
            else
                ge.obj["call"+a].hide().transform("s0");
        }
        first_call = false
    });

    socket.on('send_my_switch', function(data){

        for(a = 0; a < 5; a++){

            if(data.switches[a] && !last_card){

                anim = Raphael.animation({transform: 's0.8'}, 150, 'linear');
                delay = 0;
                if(first_switch)
                    delay = 300;
                ge.obj["switch"+a].show().animate(anim.delay(delay*11));
            }
            else
                ge.obj["switch"+a].hide().transform("s0");
        }
        first_switch = false;
    });

    var old_cards = [];
    socket.on('show_card', function(data){

        if(data.new_hand != ""){

            ge.obj[r_user+"_out"].hide();
            ge.obj[o1+"_out"].hide();
            ge.obj[r_user+"_king"].hide();
            ge.obj[o1+"_king"].hide();

            if(data.new_hand == r_user)
                for(b = 0; b < old_cards.length; b++)
                    ge.obj.past_hands.push(paper.image(preloader[old_cards[b]].src, -300, 100, 75, 115).transform("s1"));
            old_cards.splice(0,10);
        }

        if(data.king != undefined)
            ge.obj[data.player+"_king"].attr({src: preloader[data.king].src}).attr({"opacity": 0.6}).show();

        old_cards.push(data.card);
        ge.obj[data.player+"_out"].attr({x: ge[data.player][data.pos+"_pos"].x, y: ge[data.player][data.pos+"_pos"].y});
        ge.obj[data.player+"_out"].attr({src: preloader[data.card].src});
        
        ge.obj[data.player+"_c"+data.pos].attr({x: ge.obj.deck_pos.x, y: ge.obj.deck_pos.y});
        ge.obj[data.player+"_c"+data.pos].hide();
        if(data.closed == "")
            ge.obj.d2.toFront();
        ge.obj.close.toFront();
        ge.obj[data.player+"_out"].toFront();
        ge.obj[data.player+"_out"].show();
        ge.obj[data.player+"_out"].animate({x: ge[data.player].out_pos.x, y: ge[data.player].out_pos.y}, 300, "linear");
    });

    socket.on('switch_adut', function(data){

        ge.obj[r_user+"_c"+data.pos].attr({src: preloader[data.card].src});
    });

    socket.on('new_adut', function(data){

        ge.obj.adut.attr({src: preloader[data.card].src});
        for(a = 0; a < 5; a++)
            ge.obj["switch"+a].hide();
    });

    socket.on('closed', function(){

        ge.obj.close.hide();
        ge.obj.adut.toFront();
    });

    socket.on('one_card_left', function(){

        ge.obj.d1.hide();
        ge.obj.close.hide();
        for(a = 0; a < 5; a++)
            ge.obj["switch"+a].hide();
        last_card = true;
    });

    socket.on('no_card_left', function(){

        ge.obj.d1.hide();
        ge.obj.d2.hide();
        ge.obj.adut.hide();
    });

    socket.on('invalid_move', function(data){

        anim1 = Raphael.animation({x: ge[r_user][data.pos+"_pos"].x + 5, y: ge[r_user][data.pos+"_pos"].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim1);
        anim2 = Raphael.animation({x: ge[r_user][data.pos+"_pos"].x - 10, y: ge[r_user][data.pos+"_pos"].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim2.delay(50));
        anim3 = Raphael.animation({x: ge[r_user][data.pos+"_pos"].x, y: ge[r_user][data.pos+"_pos"].y}, 50, "linear");
        ge.obj[r_user+"_c"+data.pos].animate(anim3.delay(100));
    });
    
    socket.on('current_points', function(){

        socket.emit('get_my_current_points', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('send_my_current_points', function(data){

        ge.obj.points.attr("text", "Current score: " + data.score);
    });

    socket.on('who_turn', function(data){

        if(last_p != data.player){

            last_p = data.player;
            ge.obj.marker.animate({x: ge[data.player].marker_pos.x, y: ge[data.player].marker_pos.y, transform: "r" + (ge[data.player].marker_pos.r)}, 600, "linear");
        }
    });
    };
    preloader["bg"].src ="/images/schnapsen/bg.jpg"
});
