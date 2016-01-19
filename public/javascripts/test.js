$(document).ready(function() {

	for (a = 0; a < 10; a++)
		$('#list').append('<li><div class="ID">1</div><div class="password"><img src="/images/lock-white.png" width="11" height="13" /></div><div class="room-name">room name</div><div class="game-mode">game mode</div><div class="host">hostname</div><div class="players">players 1</div></li>');

	for (a = 0; a < 130; a++)
		$('#user-list').append('<li>Olyar</li>');
});