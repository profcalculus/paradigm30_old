# format duration as string
getTimeString = (time) ->
  secs = time.get('seconds')
  if secs < 10
    secs = "0#{secs}"
  "#{time.get('minutes')}:#{secs}"  

# toggle classes and disabled props of buttons
toggleButtons = (elem) ->
  if elem is "right"
    # props
    $("#left .toggle").prop "disabled", false
    $("#right .toggle").prop "disabled", true
    
    # classes
    $("#right .toggle").addClass "btn-default btn-disabled"
    $("#right .toggle").removeClass "btn-primary"
    $("#left .toggle").addClass "btn-primary"
  else if elem is "left"
    # props
    $("#left .toggle").prop "disabled", true
    $("#right .toggle").prop "disabled", false
    
    # classes
    $("#left .toggle").addClass "btn-default btn-disabled"
    $("#left .toggle").removeClass "btn-primary"
    $("#right .toggle").addClass "btn-primary"
  
# restores both toggles to original state
resetButtonClasses = ->
  $("#left input").addClass "btn-primary"
  $("#left input").removeClass "btn-default btn-disabled"
  $("#right input").addClass "btn-primary"
  $("#right input").removeClass "btn-default btn-disabled"
  
# change the time shown on page
displayTime = (elem, time) ->
  $(elem).html(getTimeString time)  

# doc ready
jQuery ($) ->
  # init timers
  t1 = moment.duration(20, "minutes")
  t2 = moment.duration(20, "minutes")
  displayTime "#left .time", t1
  displayTime "#right .time", t2
  
  # set right timer
  rightTimer = $('#right .toggle'). on 'click', -> 
    # pause other timer
    if leftTimer
      clearInterval(leftTimer)
      toggleButtons("right")
    
    rightTimer = setInterval -> 
      if t2.as('seconds') > 0
        t2.subtract moment.duration(1, 's')
        displayTime "#right .time", t2
      else
        clearInterval self
    , 1000
    
  # set left timer
  leftTimer = $('#left .toggle'). on 'click', -> 
    if rightTimer
      clearInterval(rightTimer)
      toggleButtons("left")
    
    leftTimer = setInterval -> 
      if t1.as('seconds') > 0
        t1.subtract moment.duration(1, 's')
        displayTime "#left .time", t1
      else
        clearInterval self
    , 1000
  
  # pause timer for active player
  $("#pause").on 'click', ->
    if $("#left .toggle").prop is "disabled"
      toggleButtons("left")
    else
      toggleButtons("right")
    
    clearInterval(leftTimer)
    clearInterval(rightTimer)
  
  # reset both timers and toggles
  $("#reset").on 'click', ->
    $('#time-input').val(20)
    resetAll(20)
  
  $('#time-input').on 'change', ->
    resetAll(parseInt($('#time-input').val()))
    
  resetAll = (minutes) ->
    clearInterval(leftTimer)
    clearInterval(rightTimer)
    t1 = moment.duration(minutes, "minutes")
    t2 = moment.duration(minutes, "minutes")
    displayTime "#left .time", t1
    displayTime "#right .time", t2
    
    # reset disabled property
    $("#left input").prop("disabled", false)
    $("#right input").prop("disabled", false)
    
    # reset button classes
    resetButtonClasses()