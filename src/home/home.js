(function(){
  'use strict';
  // The initialize function must be run each time a new page is loaded
  Office.initialize = function(reason) {
    jQuery(document).ready(function() {
      app.initialize();

      jQuery('#get-data-from-selection').click(getDataFromSelection);

      app.socket.on('lang', function(data) {
        var html = Prism.highlight(data.text, Prism.languages[data.lang])
        jQuery('#code').html(html);
      })

      app.socket.on('output', function(res) {
        if (app.isNotificationClosed()) {
          app.showNotification('Output', res.data);
        }
        else {
          app.appendNotification(res.data);
        }
      });

      app.socket.on('compile_error', function(res) {
        app.showError('Error', res.data);
      });

      app.socket.on('end', function(res) {
        console.log('end');
      });

      getDataFromSelection();
    });
  };

  // Reads data from current document selection and displays a notification
  function getDataFromSelection(){

    // Word.run(function (context) {

    //   // Create a proxy object for the document body.
    //   var body = context.document.body;

    //   // Queue a commmand to get the HTML contents of the body.
    //   var bodyHTML = body.getHtml();

    //   // Synchronize the document state by executing the queued commands,
    //   // and return a promise to indicate task completion.
    //   return context.sync().then(function () {
    //       console.log("Body HTML contents: " + bodyHTML.value);
    //   });
    // })
    // .catch(function (error) {
    //     console.log("Error: " + JSON.stringify(error));
    //     if (error instanceof OfficeExtension.Error) {
    //         console.log("Debug info: " + JSON.stringify(error.debugInfo));
    //     }
    // });
    
    if (!app.isNotificationClosed()) {
      app.closeNotification();
    }
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
      function(result){
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          if (result.value !== '') {
            var data = {
              text: result.value
            }
            app.socket.emit('data', data);
          }

          // app.showNotification('The selected text is:', '"' + result.value + '"');
        } else {
          app.showNotification('Error:', result.error.message);
        }
      }
    );

  }

})();
