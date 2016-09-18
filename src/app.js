var app = (function(){  // jshint ignore:line
  'use strict';

  var self = {};

  self.socket = io();

  // Common initialization function (to be called from each page)
  self.initialize = function(){
    jQuery('body').append(
      '<div id="notification-message">' +
        '<div id="notification-message-header">'+
        '</div>' +
        '<div id="notification-message-close"></div>' +
        '<div id="notification-message-body"></div>' +
      '</div>');

    self.closeNotification = function() {
      jQuery('#notification-message').hide();
      self.socket.emit('exit');
    }
    
    jQuery('#notification-message-close').click(self.closeNotification);

    // After initialization, expose a common notification function
    self.showNotification = function(header, text){
      jQuery('#notification-message-header').text(header);
      jQuery('#notification-message-body').html(text.replace(/(?:\r\n|\r|\n)/g, '<br />'));
      jQuery('#notification-message-body').append('<br/>');
      jQuery('#notification-message').slideDown('fast');
      jQuery('#notification-message').css("background-color", "#818285");
      
      interact('#notification-message')

        .resizable({
          preserveAspectRatio: false,
          edges: { top: true }
        })
        .on('resizemove', function (event) {
          var content = document.getElementById('notification-message-body');
          var target = event.target,
              y = (parseFloat(target.getAttribute('data-y')) || 0);

          // update the element's style
          target.style.height = event.rect.height + 'px';
          content.style.maxHeight = event.rect.height - 70 + 'px';
          
        });
    };

    self.isNotificationClosed = function() {
      return jQuery('#notification-message').css('display') === 'none';
    }

    self.appendNotification = function(text) {
      // console.log(text.replace(/↵/g, "\n").replace(/(?:\r\n|\r|\n)/g, '<br />'));
      jQuery('#notification-message-body').append(text.replace(/↵/g, "\n").replace(/(?:\r\n|\r|\n)/g, '<br />'));
      // jQuery('.messages').animate({ scrollTop: $(this).height() }, "slow");
      jQuery('#notification-message-body').scrollTop(jQuery('#notification-message-body')[0].scrollHeight);
    } 
    self.showError = function(header, text){
      jQuery('#notification-message-header').text(header);
      jQuery('#notification-message-body').text(text);
      jQuery('#notification-message').slideDown('fast');
      jQuery('#notification-message-header').css("background-color", "#E81123");

      interact('#notification-message')

        .resizable({
          preserveAspectRatio: false,
          edges: { top: true }
        })
        .on('resizemove', function (event) {
          var content = document.getElementById('notification-message-body');
          var target = event.target,
              y = (parseFloat(target.getAttribute('data-y')) || 0);

          // update the element's style
          target.style.height = event.rect.height + 'px';
          content.style.maxHeight = event.rect.height - 70 + 'px';
          
        });
    };


  };

  return self;
})();
