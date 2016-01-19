$(document).ready(function() {

  /////////////////
	// REG & LOGIN //
	/////////////////

	$("#login-btn").click(function(){
		//$("body").append("<div class='zunaj'></div><div class='znotraj'>TU SO JEBENI ELEMENTI</div>")
		$(document.createElement('div')).addClass("zunaj").appendTo("body").click(function(){ $(this).remove(); $(".znotraj").remove(); });
		$(document.createElement('div')).addClass("znotraj").appendTo("body").load("/html/login.html");

	});
	
	$("#register-btn").click(function(){
		//$("body").append("<div class='zunaj'></div><div class='znotraj'>TU SO JEBENI ELEMENTI</div>")
		$(document.createElement('div')).addClass("zunaj").appendTo("body").click(function(){ $(this).remove(); $(".znotraj").remove(); });
		$(document.createElement('div')).addClass("znotraj").appendTo("body").load("/html/register.html");

	});

	$("#create-room").click(function() {

		$(document.createElement('div')).addClass("zunaj").appendTo("body").click(function(){ $(this).remove(); $(".znotraj").remove(); });
		$(document.createElement('div')).addClass("znotraj").appendTo("body").load("/html/create_room.html");

	});

	////////////
	// PROFIL //
	////////////

	var temno = "#666";
	var svetlo = "#CCC";

	$("#old_password").focusin(function() {
		if($(this).val() == "Old password") {
			$(this).attr("type", "password");			
			$(this).val("").css("color", temno);
		}
	});
	
	$("#old_password").focusout(function() {
		if($(this).val() == "") {
			$(this).attr("type", "text");			
			$(this).val("Old password").css("color", svetlo);
		}
	});

	$("#new_password").focusin(function() {
		if($(this).val() == "New password") {
			$(this).attr("type", "password");			
			$(this).val("").css("color", temno);
		}
	});
	
	$("#new_password").focusout(function() {
		if($(this).val() == "") {
			$(this).attr("type", "text");			
			$(this).val("New password").css("color", svetlo);
		}
	});

	$("#old_password").change(function() {
		$("#old_password_md5").val($.MD5( $("#old_password").val()));
	});

	$("#new_password").change(function() {
		$("#new_password_md5").val($.MD5( $("#new_password").val()));
	});

	$.fn.serializeObject = function()
	{
	    var o = {};
	    var a = this.serializeArray();
	    $.each(a, function() {
	        if (o[this.name] !== undefined) {
	            if (!o[this.name].push) {
	                o[this.name] = [o[this.name]];
	            }
	            o[this.name].push(this.value || '');
	        } else {
	            o[this.name] = this.value || '';
	        }
	    });
	    return o;
	};

	$("#save").click(function() {
		var serializedData = $("#podatki").serializeObject();
		console.log("START "+$("#podatki").serializeObject()+"END");
		$.ajax({
	      url: "/profile_edit",
	      type: "post",
	      data: serializedData,
	      success: function(data){
	      	if(data=="SUCCESS") {
	          $("#response").css("background", "url(/images/success.png) no-repeat").css("display", "block");
	          $("#response").fadeOut(1500);
	          //$(".input_pw").css("background", "url(/images/input.png) no-repeat");
	          $(".input_pw").toggleClass("good_pw");
	      	} else if (data=="ERROR") {
	          $("#response").css("background", "url(/images/error.png) no-repeat").css("display", "block");
	          $("#response").fadeOut(1500);
	          //$(".input_pw").css("background", "url(/images/input_error.png) no-repeat");
	          $(".input_pw").toggleClass("wrong_pw");
	      	} else
	      		console.log("User not logged in. MUST CHECK");
	      },
	      error: function(){
	      	console.log("Something went wrong at PROFILE EDITING AJAX");
	      }   
	    }); 
	});
});