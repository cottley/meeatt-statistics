/*jslint sloppy: true */
/*global document, navigator */

function onConfirmQuit(button) {
    if (button == "1") {
        navigator.app.exitApp();
    }
}

function init() {
  //$("#graph").width($(window).width()-20);
  //$("#graph").height($(window).height()/2);
    
    document.addEventListener("backbutton", function () {
        navigator.notification.confirm(
            'Do you want to quit?',
            onConfirmQuit,
            'MEEA TT Statistics',
            ['OK', 'Cancel']
        );
    }, true);
}

function exitApp() {
    navigator.notification.confirm(
        'Do you want to quit?',
        onConfirmQuit,
        'Exit MEEA TT Statistics',
        ['Yes', 'No']
    );
}
