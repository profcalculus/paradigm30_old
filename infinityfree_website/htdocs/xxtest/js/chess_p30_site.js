$ (function () {

  var board = null;
  var promoting = false;
  var game = new Chess ();
  var $status = $ ('#status');
  var $fen = $ ('#fen');
  var $pgn = $ ('#pgn-list');
  var promotion_dialog = $ ('#promotion-dialog');
  var moveNumber = 1;
  var current_san = '';

  function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over ()) return false;

    // only pick up pieces for the side to move
    if (
      (game.turn () === 'w' && piece.search (/^b/) !== -1) ||
      (game.turn () === 'b' && piece.search (/^w/) !== -1)
    ) {
      return false;
    }
  }

  // var testFEN = '8/3P3P/8/1k6/8/6K1/1p1p4/8 w - - 0 1';

  // function testPosition() {
  //     game = new Chess(testFEN);
  //     board.position(testFEN);
  // }

  function getImgSrc (piece) {
    return config.pieceTheme.replace (
      '{piece}',
      game.turn () + piece.toLocaleUpperCase ()
    );
  }
  var promotion_piece = 'Q';

  function choose_promotion (color) {
    $ ('#promotion-popup').dialog ({
      modal: true,
    });
    return $ ("input[name='promo']:checked").val ();
  }

  var onDrop = function (source, target) {
    move_cfg = {
      from: source,
      to: target,
      promotion: 'q',
    };

    // check we are not trying to make an illegal pawn move to the 8th or 1st rank,
    // so the promotion dialog doesn't pop up unnecessarily
    // e.g. (p)d7-f8
    var move = game.move (move_cfg);
    // illegal move
    if (move === null) {
      return 'snapback';
    } else {
      game.undo (); //move is ok, now we can go ahead and check for promotion
    }

    // is it a promotion?
    var source_rank = source.substring (2, 1);
    var target_rank = target.substring (2, 1);
    var piece = game.get (source).type;

    if (
      piece === 'p' &&
      ((source_rank === '7' && target_rank === '8') ||
        (source_rank === '2' && target_rank === '1'))
    ) {
      promoting = true;

      // get piece images
      $ ('.promotion-piece-q').attr ('src', getImgSrc ('q'));
      $ ('.promotion-piece-r').attr ('src', getImgSrc ('r'));
      $ ('.promotion-piece-n').attr ('src', getImgSrc ('n'));
      $ ('.promotion-piece-b').attr ('src', getImgSrc ('b'));

      //show the select piece to promote to dialog
      promotion_dialog
        .dialog ({
          modal: true,
          height: 46,
          width: 184,
          resizable: true,
          draggable: false,
          close: onDialogClose,
          closeOnEscape: false,
          dialogClass: 'noTitleStuff',
        })
        .dialog ('widget')
        .position ({
          of: $ ('#board'),
          my: 'middle middle',
          at: 'middle middle',
        });
      //the actual move is made after the piece to promote to
      //has been selected, in the stop event of the promotion piece selectable
      return;
    }
    // no promotion, go ahead and move
    makeMove (game, move_cfg);
    updateStatus (move);
  };

  function makeMove (game, cfg) {
    // see if the move is legal
    var move = game.move (cfg);
    // illegal move
    if (move === null) return 'snapback';
    return move;
  }

  function updateBoard (board, move) {
    board.position (game.fen (), false);
    updateStatus (move);
    promoting = false;
  }

  var onDialogClose = function () {
    // console.log(promote_to);
    move_cfg.promotion = promote_to;
    move = makeMove (game, move_cfg);
    updateBoard (board, move);
  };

  function onSnapEnd () {
    //if promoting we need to select the piece first
    if (promoting) return;
    board.position (game.fen ());
  }

  function updateStatus (move) {
    var status = '';
    if (move && move.san) {
      // Put suitable "dragon-bishop" symbol here
      move.san = move.san.replace ('B', 'D');
      if (move.color === 'w') {
        current_san = current_san + moveNumber + '. ' + move.san;
        $pgn.append ('<li>' + current_san + '</li>');
      } else {
        current_san = current_san + '\t\t\t' + move.san;
        $ ('li', $pgn).last ().remove (); // Remove partial moves
        $pgn.append ('<li>' + current_san + '</li>'); // Replace with full moves
        current_san = '';
        moveNumber += 1;
      }
    }
    var moveColor = 'White';
    if (game.turn () === 'b') {
      moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate ()) {
      status = 'Game over, ' + moveColor + ' is checkmated!';
    } else if (game.in_draw ()) {
      // draw?
      status = 'Game over, draw!';
    } else {
      // game still on
      status = moveColor + ' to move';

      // check?
      if (game.in_check ()) {
        status += ' - ' + 'check!';
      }
    }
    $status.html (status);
  }

  function pgnHeader () {
    $pgn.empty ();
    var date = new Date ();
    var yyyy = date.getFullYear ();
    var mm = date.getMonth () + 1;
    var dd = date.getDate ();
    if (mm < 10) {
      mm = '0' + mm;
    }
    if (dd < 10) {
      dd = '0' + dd;
    }
    var datestr = yyyy + '/' + mm + '/' + dd;
    $pgn.append ('<li class="tinygreen">[Date "' + datestr + '"]</li>');
    var fenstr = '<li class="tinygreen">' + game.fen () + '"]</li>';
    $pgn.append (
      '<li class="tinygreen">[SetUp "1"] [StartPos ' + fenstr + '</li>'
    );
  }

  var config = {
    pieceTheme: 'img/chesspieces/paradigm30/{piece}.png',
    draggable: true,
    //position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
  };

  $ (window).on ('load', function () {
    board = Chessboard ('myBoard', config);
    board.position (game.fen ());
    updateStatus ();
    pgnHeader ();
  });

  // init promotion piece dialog
  $ ('#promote-to').selectable ({
    stop: function () {
      $ ('.ui-selected', this).each (function () {
        var selectable = $ ('#promote-to li');
        var index = selectable.index (this);
        if (index > -1) {
          var promote_to_html = selectable[index].innerHTML;
          var span = $ ('<div>' + promote_to_html + '</div>').find ('span');
          promote_to = span[0].innerHTML;
        }
        promotion_dialog.dialog ('close');
        $ ('.ui-selectee').removeClass ('ui-selected');
        // updateBoard(board);
      });
    },
  });
    // Since we're all loaded, reveal the html
    $ ('body').css ('display','initial');

});
