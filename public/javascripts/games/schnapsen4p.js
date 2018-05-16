$(document).ready(function() {
    var players = [];
    var o1, o2, o3;
    var last_p = "";
    var card_index = 0;
    var call_delete_index = 0;
    var url = $(location).attr('href');
    var g_id = url.split("/")[4];
    var r_id = url.split("/")[6];
    if ($.cookie('username') == null )
        $.cookie('username', "Guest4"+Math.round(Math.random()*10000));
    var r_user = "Guest4"+Math.round(Math.random()*10000);

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
    

    var img = [];
    tarr = new Array("p", "s", "k", "a");
    for(a = 1; a <= 6; a++)
        for(b = 0; b < tarr.length; b++){
            img[tarr[b]+""+a] = new Image();
            img[tarr[b]+""+a].src = "/images/schnapsen/" + tarr[b]+a + ".gif";
        }
    img["back"] = new Image();
    img["back"].src = "/images/schnapsen/back.gif";
    tarr = new Array("snops", "small", "big", "twelve", "eighteen", "twenty-four", "pass", "dd", "confirm", "call", "shuffle");
    for(a = 0; a < tarr.length; a++){

        img[tarr[a]+"b_idle"] = new Image();
        img[tarr[a]+"b_hover"] = new Image();
        img[tarr[a]+"b_idle"].src   = "/images/schnapsen/" + tarr[a] + "_b_idle.png";
        img[tarr[a]+"b_hover"].src = "/images/schnapsen/" + tarr[a] + "_b_hover.png";
        if(a < 6){

            img[tarr[a]+"n_idle"] = new Image();
            img[tarr[a]+"n_hover"] = new Image();
            img[tarr[a]+"n_idle"].src  = "/images/schnapsen/" + tarr[a] + "_n_idle.png";
            img[tarr[a]+"n_hover"].src = "/images/schnapsen/" + tarr[a] + "_n_hover.png";
        }
    }
    img["past_hands"] = new Image();
    img["past_hands"].src = "/images/schnapsen/past_hands.png";
    img["marker"] = new Image();
    img["marker"].src = "/images/schnapsen/on-turn.png";
    img["bg"] = new Image();
    
    img["bg"].onload = function () {

    var socket = io.connect();    

    obj = [];
    pos = [];
    obj["main"] = paper.image("/images/schnapsen/bg.jpg", 0, 0, 900, 600);
    obj["score"] = paper.rect(910, 0, 200, 600, 10).attr({

        "stroke-width": 0,
        "stroke": "#b2b9c2",
        "fill": "#dde4eb"
    });
    paper.path("M 910 108 l 200 0"); 
    paper.path("M 960 150 l 0 150");
    paper.path("M 1005 150 l 0 150");
    paper.path("M 1050 150 l 0 150");
    paper.path("M 906 0 l 0 900").attr({

        "stroke-width": 13,
        "stroke": "#ffffff",
        "fill": "#ffffff"
    }).toBack();

    obj["deck"] = paper.image(img.back.src, 650, 200, 105, 165);
    obj["past_hands"] = [];
    socket.on('player_change', function(data){

        players = data.players;
        if(obj.notification == undefined)
            obj["notification"] = paper.text(110, 140, "Waiting for 4 players.").attr({ "font-size": 18, "font-family": "Helvetica, Arial, sans-serif", "fill": "#ffffff", "text-anchor": "start"});
        for ( a = 0; a < 4; a++){
            if(obj["p1"+a] == undefined)
                obj["p1"+a] =  paper.text(915, 30+a*20, "Waiting for player").attr({ "font-size": 14,"font-family": "Helvetica, Arial, sans-serif", "fill": "#000000", "text-anchor": "start"});
            else
                obj["p1"+a].attr("text", "Waiting for player");
            if(obj["p2"+a] == undefined)
                obj["p2"+a] =  paper.text(940+a*45, 120+((a%2)*15), "waiting").attr({ "font-size": 10,"font-family": "Helvetica, Arial, sans-serif", "fill": "#000000"});
            else
                obj["p2"+a].attr("text", "waiting");
        }
        for ( a = 0; a < players.length; a++){

            obj["p1"+a].attr("text", players[a]);
            obj["p2"+a].attr("text", players[a]);
        }

        if(players.length == 4)
            obj.notification.attr("text", "Waiting for " + players[0] + " to shuffle the deck.");
        if(r_user == players[0] && players.length == 4){

            obj["shuffle"] = paper.image(img.shuffleb_idle.src, 650, 265, 105, 34).transform("s0.8").click(function () {
            
                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: "start",
                    action: "start"
                })
                this.remove();
            }).hover(function () {

                    this.attr({src: img.shuffleb_hover.src});
                },function() {

                    this.attr({src: img.shuffleb_idle.src});
            });
        }
    });    

    socket.on('notification', function(data){

        obj.notification.attr("text", data.msg);
    });

    socket.on('send_total_score', function(data){

        paper.text(940, 150+20*data.round, data.score1).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000"});
        paper.text(985, 150+20*data.round, data.score2).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000"});
        paper.text(1030, 150+20*data.round, data.score3).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000"});
        paper.text(1075, 150+20*data.round, data.score4).attr({ "font-size": 10, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#000000"});
    });

    socket.on('new_round', function(data){

        obj["deck"] = paper.image(img.back.src, 650, 200, 105, 165);
        if(players[data.p_onturn] == r_user){

            obj["shuffle"] = paper.image(img.shuffleb_idle.src, 650, 265, 105, 34).transform("s0.8").click(function () {
            
                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: "start",
                    action: "start"
                })
                this.remove();
            }).hover(function () {

                    this.attr({src: img.shuffleb_hover.src});
                },function() {

                    this.attr({src: img.shuffleb_idle.src});
            });
        }
    });

    socket.on('start', function(data){

        p_onturn = data.p_onturn;
        
        if(data.next_round){

            for(a = 0; a < 5; a++){

                if(obj[r_user+"_c"+a] != undefined)
                    obj[r_user+"_c"+a].remove();
                obj[r_user+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165)
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
                    this.animate({ transform: 's1.2'}, 50, 'linear');
                },function() {

                    this.animate({ transform: 's1'}, 50, 'linear');
                });
                if(obj[o1+"_c"+a] != undefined)
                    obj[o1+"_c"+a].remove();
                if(obj[o2+"_c"+a] != undefined)
                    obj[o2+"_c"+a].remove();
                if(obj[o3+"_c"+a] != undefined)
                    obj[o3+"_c"+a].remove();
                obj[o1+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                obj[o2+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                obj[o3+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                if(obj["call"+a+""] != undefined)
                    obj["call"+a+""].remove
            }
            for(a = 0; a < 4; a++){

                if(obj[players[a]+"_call_king"] != undefined)
                    obj[players[a]+"_call_king"].remove()
            }
            obj.past_hands.splice(0,100);
            old_cards.splice(0,10);
            obj["adut"].remove();
        }else{

            num = players.indexOf(r_user);
            o1 = players[((num+1)%4)];
            o2 = players[((num+2)%4)];
            o3 = players[((num+3)%4)];

            obj["marker"] = paper.image(img.marker.src, 400, 370, 93, 59);
            pos[r_user + "_m"] = {x: 265, y: 395, r: 0};
            pos[o1 + "_m"] = {x: 80, y: 220, r: 90};
            pos[o2 + "_m"] = {x: 370, y: 90, r: 180};
            pos[o3 + "_m"] = {x: 750, y: 220, r: 270};
            obj.marker.animate({x: pos[players[p_onturn] + "_m"].x, y: pos[players[p_onturn] + "_m"].y, transform: "r" + (pos[players[p_onturn] + "_m"].r)}, 600, "linear");
            for(a = 0; a < 5; a++){

                obj[r_user+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165)
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
                    this.animate({ transform: 's1.2'}, 50, 'linear');
                },function() {

                    this.animate({ transform: 's1'}, 50, 'linear');
                });
                obj[o1+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                obj[o2+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                obj[o3+"_c"+a] = paper.image(img.back.src, 650, 200, 105, 165);
                pos[r_user+a+""] = {x: 160+a*110, y: 480, r: 0};
                pos[o1+a+""] = {x: -50, y: 100+a*45, r: 90};
                pos[o2+a+""] = {x: 280+a*45, y: -80, r: 0};
                pos[o3+a+""] = {x: 870, y: 100+a*45, r: 90};
            }
            pos[r_user + "_out"] = {x: 400, y: 300, r: 0};
            pos[o1 + "_out"] = {x: 300, y: 200, r: 90};
            pos[o2 + "_out"] = {x: 400, y: 100, r: 0};
            pos[o3 + "_out"] = {x: 520, y: 200, r: 90};
            pos[r_user + "_king"] = {x: 430, y: 300, r: 0};
            pos[o1 + "_king"] = {x: 300, y: 230, r: 90};
            pos[o2 + "_king"] = {x: 430, y: 100, r: 0};
            pos[o3 + "_king"] = {x: 520, y: 230, r: 90};
            paper.image(img.past_hands.src, 0, 490, 35, 100).hover(function () {

                    for(a = 0; a < obj.past_hands.length; a++){

                        obj.past_hands[a].animate({x: 100+((a%4)*50), y: 30+(Math.floor(a/4)*120)},300,">");
                        obj.past_hands[a].toFront();
                    }
                },function() {

                    for(a = 0; a < obj.past_hands.length; a++)
                        obj.past_hands[a].animate({x: -300, y: 100},300,">");
                });
        }
        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: 0, end: 3});
        socket.emit('get_aduts', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    var old_cards = [];
    socket.on('show_card', function(data){

        if(data.new_hand.length > 0){

            for(a = 0; a < 3; a++)
                if(obj[players[a]+"_king"] != undefined)
                    obj[players[a]+"_king"].remove();
            for(a = 0; a < data.new_hand.length; a++)
                if(data.new_hand[a] == r_user)
                    for(b = 0; b < old_cards.length; b++)
                        obj.past_hands.push(paper.image(obj[old_cards[b]].attr("src"), -300, 100, 75, 115).transform("s1"));
            for(a = 0; a < old_cards.length; a++)
                obj[old_cards[a]].remove();
            old_cards.splice(0,10);
        }

        if(data.king != undefined){

            obj[data.player+"_call_king"] = paper.image(img[data.king].src, pos[data.player + "_king"].x, pos[data.player + "_king"].y, 105, 165).transform("r" + pos[data.player + "_king"].r);
            obj[data.player+"_c"+data.pos].toFront();
            obj[data.player+"_call_king"].attr({"opacity": 0.6})
        }
        old_cards.push(data.player+"_c"+data.pos);
        if(data.player != r_user)
            obj[data.player+"_c"+data.pos].animate({x: pos[data.player + "_out"].x, y: pos[data.player + "_out"].y, transform: "r" + pos[data.player + "_out"].r}, 300, "linear");
        else
            obj[data.player+"_c"+data.pos].animate({x: pos[data.player + "_out"].x, y: pos[data.player + "_out"].y, transform: "s1r" + pos[data.player + "_out"].r}, 300, "linear");
        obj[data.player+"_c"+data.pos].attr({src: img[data.card].src});
        obj[data.player+"_c"+data.pos].toFront();
        obj[data.player+"_c"+data.pos].node.setAttribute("pointer-events", "none");
    });

    socket.on('show_small_card', function(data){

        if(data.player != r_user)
            obj[data.player+"_c"+data.pos].animate({x: 200+data.whois*120, y: 100+data.num*40, transform: "r0"}, 300, "linear");
        else
            obj[data.player+"_c"+data.pos].animate({x: 200+data.whois*120, y: 100+data.num*40, transform: "s1r0"}, 300, "linear");
        obj[data.player+"_c"+data.pos].attr({src: img[data.card].src});
        obj[data.player+"_c"+data.pos].toFront();
        obj[data.player+"_c"+data.pos].node.setAttribute("pointer-events", "none");
    });

    socket.on('deal_cards', function(data){

        socket.emit('get_my_cards', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a", begin: data.begin, end: data.end});
    });

    socket.on('send_my_cards', function(data){

        delay = 300;
        for(a = data.begin; a < data.end; a++){

            obj[r_user+"_c"+a].attr({src: img[data.cards[a]].src});

            anim1 = Raphael.animation({x: pos[r_user+a+""].x , y: pos[r_user+a+""].y, transform: "r" + (pos[r_user+a+""].r)}, delay, ">");
            anim2 = Raphael.animation({x: pos[o1+a+""].x , y: pos[o1+a+""].y, transform: "r" + (pos[o1+a+""].r)}, delay, ">");
            anim3 = Raphael.animation({x: pos[o2+a+""].x , y: pos[o2+a+""].y, transform: "r" + (pos[o2+a+""].r)}, delay, ">");
            anim4 = Raphael.animation({x: pos[o3+a+""].x , y: pos[o3+a+""].y, transform: "r" + (pos[o3+a+""].r)}, delay, ">");

            obj[r_user+"_c"+a].animate(anim1.delay((a%3)*(delay*4)+delay));
            obj[o1+"_c"+a].animate(anim2.delay((a%3)*(delay*4)+delay*2));
            obj[o2+"_c"+a].animate(anim3.delay((a%3)*(delay*4)+delay*3));
            obj[o3+"_c"+a].animate(anim4.delay((a%3)*(delay*4)+delay*4));
            obj[o3+"_c"+a].toBack();
            obj.main.toBack();
        }
    });

    socket.on('show_aduts', function(){

        tarr = [];
        tarr.push("s6");
        tarr.push("k6");
        tarr.push("a6");
        tarr.push("p6");
        for(a = 0; a < 4; a++){

            obj["adut"+a] = paper.image(img[tarr[a]].src, 180+a*110, 200, 105, 165).transform("s0")
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

                    obj["adut"+b].node.setAttribute("pointer-events", "none");
                    obj["adut"+b].remove();
                }
            }).hover(function () {

                this.toFront();
                this.animate({ transform: 's1.18'}, 50, 'linear');
            },function() {

                this.animate({ transform: 's1'}, 50, 'linear');
            });
            anim = Raphael.animation({transform: "s1"}, 300, "linear");
            obj["adut"+a].animate(anim.delay(360));
        }
    });

    socket.on('show_adut', function(data){

        obj["adut"] = paper.image(img[data.card].src, 790, 430, 105, 165).transform("s0");
        anim = Raphael.animation({transform: "s1"}, 300, "linear");
        obj["adut"].animate(anim.delay(300));
    });

    socket.on('what_to_play_state', function(data){

        obj.deck.remove();
        delay = 100;
        counter = 0;
        anim = Raphael.animation({transform: "s0.8"}, delay, "linear");
        tarr = new Array();
        if(data.player == r_user){

            if(data.play <= 0 && (data.m == 1 || data.play == 0))
                tarr.push("snops");
            if(data.play <= 1 && (data.m == 1 || data.play == 0))
                tarr.push("small");
            if(data.play <= 2 && (data.m == 1 || data.play == 0))
                tarr.push("big");
            if(data.play <= 3 && (data.m == 1 || data.play == 0))
                tarr.push("twelve");
            if(data.play <= 4 && (data.m == 1 || ((data.play == 1 || data.play == 2)&& data.m == 2)))
                tarr.push("eighteen");
            if(data.play <= 5 && (data.m == 1 || ((data.play == 1 || data.play == 2 || data.play == 3) && data.m == 2)))
                tarr.push("twenty-four");
            for(a = 0; a < tarr.length; a++){

                obj["playn"+a] = paper.image(img[tarr[a]+"n_idle"].src, 110 + 65*(6-tarr.length) + a*110, 220, 129, 49).transform("s0");
                obj["playb"+a] = paper.image(img[tarr[a]+"b_idle"].src, 110 + 65*(6-tarr.length) + a*110, 170, 129, 34).transform("s0")
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
                        for(b = 0; b < 7; b++){

                            if(obj["playn"+b] != undefined)
                                obj["playn"+b].remove();
                            if(obj["playb"+b] != undefined)
                                obj["playb"+b].remove();
                        }
                        obj.playbpass.remove();
                        obj.playbdd.remove();
                    }).hover(function () {

                        this.attr({src: img[this.data("pos")+"b_hover"].src});
                        obj["playn"+this.data("index")].attr({src: img[this.data("pos")+"n_hover"].src});
                    },function () {

                        this.attr({src: img[this.data("pos")+"b_idle"].src});
                        obj["playn"+this.data("index")].attr({src: img[this.data("pos")+"n_idle"].src});
                    });
                obj["playn"+a].animate(anim.delay(delay*a));
                obj["playb"+a].animate(anim.delay(delay*a));
                counter++;
            }
            if(tarr.length == 0 && !data.can_double){

                socket.emit('send_move', {
                    r_id: r_id, 
                    g_id: g_id, 
                    r_user: r_user,
                    turn: "play_selected",
                    action: "pass"
                });
            }else if(data.can_pass){

                obj["playbpass"] = paper.image(img.passb_idle.src, 270, 310, 168, 45)
                    .transform("s0")
                    .click(function () {

                        socket.emit('send_move', {
                            r_id: r_id, 
                            g_id: g_id, 
                            r_user: r_user,
                            turn: "play_selected",
                            action: "pass"
                        });
                        for(b = 0; b < 7; b++){
                            if(obj["playn"+b] != undefined)
                                obj["playn"+b].remove();
                            if(obj["playb"+b] != undefined)
                                obj["playb"+b].remove();
                        }
                        this.remove();
                        if(obj["playbdd"] != undefined)
                            obj["playbdd"].remove();
                    }).hover(function () {

                        this.attr({src: img.passb_hover.src});
                    },function () {

                        this.attr({src: img.passb_idle.src});
                    });
                    obj["playbpass"].animate(anim.delay(delay*counter));
                    counter++;
            }
            if(data.can_double){

                obj["playbdd"] = paper.image(img.ddb_idle.src, 470, 310, 168, 45)
                    .transform("s0")
                    .click(function () {

                        socket.emit('send_move', {
                            r_id: r_id, 
                            g_id: g_id, 
                            r_user: r_user,
                            turn: "play_selected",
                            action: "double"
                        });
                        for(b = 0; b < 7; b++){
                            if(obj["playn"+b] != undefined)
                                obj["playn"+b].remove();
                            if(obj["playb"+b] != undefined)
                                obj["playb"+b].remove();
                        }
                        if(obj["playbpass"] != undefined)
                            obj["playbpass"].remove();
                        this.remove();
                    }).hover(function () {

                        this.attr({src: img.ddb_hover.src});
                    },function () {

                        this.attr({src: img.ddb_idle.src});
                    });
                    obj["playbdd"].animate(anim.delay(delay*counter));
            }
        }
    });

    socket.on('announce_plays', function(data){

        tarr = new Array("Normal (1x)", "Schnapsen (6)", "Small (7)", "Big (9)", "Twelve (12)", "Eighteen(18)", "Twenty four (24)");
        if(obj.who_what_play == undefined)
            obj.who_what_play = paper.text(630, 130, data.whoplay + "\n" + tarr[data.play]).attr({ "font-size": 22, "font-weight": "bold","font-family": "Helvetica, Arial, sans-serif", "fill": "#62b034"});
        else{

            tarr2 = new Array(3,6,7,9,12,18,24);
            tarr = new Array("Normal ", "Schnapsen ", "Small ", "Big ", "Twelve ", "Eighteen ", "Twenty four ");
            num = 0;
            if(tarr2[data.play]*data.m > 25)
                num = 25;
            else
                num = tarr2[data.play]*data.m;
            if(data.play == 6)
                obj.who_what_play.attr("text" , data.whoplay + "\n" + tarr[data.play] + "(24)");
            else if(data.play > 0 )
                obj.who_what_play.attr("text" , data.whoplay + "\n" + tarr[data.play] + "(" + num + ")");
            else
                obj.who_what_play.attr("text" , data.whoplay + "\n" + tarr[data.play] + "("+data.m+"x)");
        }
    });

    socket.on('play_state', function(data){

        anim = Raphael.animation({x: 840, y: 25, transform: "s0.8"}, 800, "linear");
        obj.who_what_play.animate(anim.delay(300));
        if(data.play <= 1)
            socket.emit('get_my_calls', {r_user: r_user, g_id: g_id, r_id: r_id, auth: "a"});
    });

    socket.on('send_my_calls', function(data){

        for(a = 0; a < 5; a++){

            if(obj["call"+a+""] != undefined)
                obj["call"+a+""].remove();
            if(data.calls[a]){

                obj["call"+a+""] = paper.image(img.button.callb_idle, 160+a*110, 475, 105, 34).transform("s0.8")
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

    socket.on('who_turn', function(data){

        if(last_p != data.player){

            last_p = data.player;
            obj.marker.animate({x: pos[data.player + "_m"].x, y: pos[data.player + "_m"].y, transform: "r" + (pos[data.player + "_m"].r)}, 600, "linear");
        }
    });

    socket.on('invalid_move', function(data){

        anim = Raphael.animation({x: pos[r_user+data.pos+""].x + 5, y: pos[r_user+data.pos+""].y}, 50, "linear");
        obj[r_user+"_c"+data.pos].animate(anim);
        anim = Raphael.animation({x: pos[r_user+data.pos+""].x - 10, y: pos[r_user+data.pos+""].y}, 50, "linear");
        obj[r_user+"_c"+data.pos].animate(anim.delay(50));
        anim = Raphael.animation({x: pos[r_user+data.pos+""].x, y: pos[r_user+data.pos+""].y}, 50, "linear");
        obj[r_user+"_c"+data.pos].animate(anim.delay(100));
    });

    socket.on('connect', function() {

        socket.emit('join_room', {
            r_id: r_id, 
            g_id: g_id, 
            r_user: r_user
        });

    });
    };
    img["bg"].src ="/images/schnapsen/bg.jpg"
});