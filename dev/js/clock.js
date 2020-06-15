const STATES = {
  PAUSED: 1,
  STOPPED: 2,
  RUNNING_W: 3,
  RUNNING_B: 4,
  TIMELOSS_W: 5,
  TIMELOSS_B: 6,
};

const RUNNING_STATES = new Set ([STATES.RUNNING_W, STATES.RUNNING_B]);
Object.freeze (STATES);
Object.freeze (RUNNING_STATES);
const DEFAULT = {
  minutes: 3,
  seconds: 0,
};

var clock = (function () {
  const MODES = ['Standard', 'Fischer', 'Bronstein'];
  // 'base_minutes' is the main time control
  // 'base_seconds' is the increment or delay, if any:
  // 'Fischer' <=> increment, 'Bronstein' <=> delay
  var state = {
    mode: 'Standard',
    base_minutes: DEFAULT.minutes,
    base_seconds: DEFAULT.seconds,
    run_state: 'STOPPED',
    w: {
      current_time: DEFAULT.minutes * 60,
      delay: DEFAULT.seconds, // only used for mode === 'Bronstein'
      lost_on_time: false,
    },
    b: {
      current_time: DEFAULT.minutes * 60,
      delay: DEFAULT.seconds, // only used for mode === 'Bronstein'
      lost_on_time: false,
    },
  };
  var timer_id = null; // Reference to callback timer
  // var slider_sec_onslide = function (event, ui) {
  //   state.base_seconds = ui.value;
  //   reset ();
  // };
  // function slider_min_onslide (event, ui) {
  //   state.base_minutes = ui.value;
  //   reset ();
  // }

  function on_second_spin(event, ui) {
    console.log("seconds:" + ui.value);
  }
  function on_minute_spin(event, ui) {
    console.log("minutes:" + ui.value);
  }
  function mode_onchange (event) {
    var mode = $ (this).find (':selected').text ();
    state.mode = mode;
    // console.log (mode + ' mode selected');
    if (mode === 'Standard') {
      $ ('#slider-sec').hide ();
    } else {
      $ ('#slider-sec').show ();
    }
  }

  function reset () {
    state.w.current_time = state.b.current_time =
      60 * state.base_minutes + state.base_seconds;
    state.w.delay = state.b.delay = state.base_seconds;
    update_time_display ('w');
    update_time_display ('b');
  }

  function startstop (ev) {
    var $button = $ (this);
    if ($button.html () === 'Start') {
      start ();
      $button.html ('Stop').removeClass ('btn-primary').addClass ('btn-danger');
    } else {
      stop ();
      $button
        .html ('Start')
        .removeClass ('btn-danger')
        .addClass ('btn-primary');
    }
  }

  var start = function (player) {
    $ ('#settings').controlgroup ('option', 'disabled', true);
    var opponent = player === 'w' ? 'b' : 'w';
    switch (MODES.indexOf (state.mode)) {
      case 0: // Standard
        break;
      case 1: // Fischer (increment)
        state[player].current_time += state.base_seconds;
        break;
      case 2: // Bronstein (delay)
        // Subtract any unused delay seconds from *opponent's* clock
        state[opponent].current_time -= state[opponent].delay;
        state[player].delay = state.base_seconds;
        state[player].current_time += state[player].delay;
        break;
      default:
        console.log ('ERROR: unknown mode ' + state.mode);
    }
    if (!RUNNING_STATES.has (state.run_state)) {
      // Start the callback timer
      timer_id = setInterval (timer_callback, 1000);
    }
    state.run_state = player === 'w' ? STATES.RUNNING_W : STATES.RUNNING_B;
  };

  var stop = function (new_state = STATES.STOPPED) {
    state.run_state = new_state;
    clearInterval (timer_id);
    $ ('#settings').controlgroup ('option', 'disabled', false);
    // TODO: Notify everybody
  };
  function lost_on_time (player) {
    var new_state = player === 'w' ? STATES.TIMELOSS_W : STATES.TIMELOSS_B;
    stop (new_state);
  }

  function setstate (new_state) {
    if (STATES.RUNNING_STATES.has (new_state)) {
      $ ('#settings').controlgroup ('option', 'disabled', true);
      if (timer_id === null) {
        timer_id = setInterval (timer_callback, 1000);
      } else {
        clearInterval (timer_id);
        timer_id = null;
      }
      state.run_state = new_state;
    }
  }
  function update_time_display (player) {
    // format time for display
    var time = state[player].current_time;
    var mins = Math.trunc (time / 60);
    var secs = time % 60;
    if (secs < 10) {
      secs = '0' + secs;
    }
    var timestr = mins + ':' + secs;
    // Update the actual clock display
    $ (`#${player}time`).text (timestr);
  }

  function adjust_time (
    player,
    mode,
    tick = 1.0 /**
   * Adjusts time for the current player 
   * after one timer tick. Also decrements delay if applicable */
  ) {
    if (mode == 'Bronstein') {
      state[player].seconds = Math.max (0, state[player].seconds - tick);
    }
    state[player].current_time -= tick;
    return state[player].current_time;
  }

  function timer_callback () {
    var player = state.run_state == STATES.RUNNING_W ? 'w' : 'b';
    adjust_time (player, state.mode);
    update_time_display (player);
    if (state[player].current_time <= 0) {
      lost_on_time (player);
      return;
    }
  }

  return {
    // slider_sec_onslide: slider_sec_onslide,
    // slider_min_onslide: slider_min_onslide,
    on_minute_spin:on_minute_spin,
    on_second_spin:on_second_spin,
    mode_onchange: mode_onchange,
    reset: reset,
    startstop: startstop,
    // start: start,
    // stop: stop,
  };
}) ();
