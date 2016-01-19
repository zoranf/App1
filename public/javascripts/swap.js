$(document).ready(function() {

	var img_src = "";
	var new_src = "";

	$(".rollover").mouseover(function() {

		img_src = $(this).attr('src');
		new_src = $(this).attr('rel');

		$(this).attr('src', new_src);
		$(this).attr('rel', img_src);
	}).mouseout(function(){

		$(this).attr('src', img_src);
		$(this).attr('rel', new_src);
	});
});