/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var OPTION_DICT = {
    //"facebook_id": "xxx",
    //"data_download_url": "fr_2020_municipal_elections_1st_round_results_by_voting_office.txt"
  };

  rJS(window)

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var gadget = this;
      return gadget.getDeclaredGadget("cruncher")
        .push(function (my_cruncher_gadget) {
          return my_cruncher_gadget.render(OPTION_DICT);
        })
        .push(null, function (my_error) {
          console.log(my_error);
          throw my_error;
        });
    });

}(window, rJS, RSVP));