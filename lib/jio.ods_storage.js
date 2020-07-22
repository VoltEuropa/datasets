/**
 * 
 * CUSTOM ODS (Open Data Soft - https://public.opendatasoft.com) Storage
 * 
 * 
 **/
/*jslint indent: 2, nomen: true, maxlen: 120*/
/*global jIO, RSVP, UriTemplate, JSON, Query */
(function (jIO, RSVP, UriTemplate, JSON, Query) {
  "use strict";

  var ALLDOCS_URL = "https://public.opendatasoft.com/api/records/1.0/search/?" +
    "dataset={dataset}&q={search}&facet=datemiseajour&facet=pivotlocal&facet=" +
    "adresse_nomcommune&facet=nom_epci&facet=nom_dep&facet=nom_reg&refine.piv" +
    "otlocal=Mairie&start={token}";
  var ALLDOCS_TEMPLATE = UriTemplate.parse(ALLDOCS_URL);

  function handleError(error, id) {
    if (error.target && error.target.status === 404) {
      throw new jIO.util.jIOError("Cannot find document: " + id, 404);
    }
    throw error;
  }

  function ODSStorage(spec) {

    if (typeof spec.data_set !== 'string' || !spec.data_set) {
      throw new TypeError("data_set must be a string " +
                          "which contains more than one character.");
    }
    this._data_set = spec.data_set;
  }

  ODSStorage.prototype.get = function (id) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({type: "GET", url: id, dataType: "text"});
      })
      .push(
        function (response) {
          return JSON.parse(response.target.response || response.target.responseText);
        },
        function (error) {
          if ((error.target !== undefined) &&
              (error.target.status === 404)) {
            throw new jIO.util.jIOError("Cannot find document", 404);
          }
          throw error;
        }
      );
  };

  ODSStorage.prototype.hasCapacity = function (name) {
    return ((name === "list") || (name === "include") || (name === "query"));
  };

  ODSStorage.prototype.buildQuery = function (options) {
    var query;
    var data_set = this._data_set;
    if (options.query === undefined) {
      throw new jIO.util.jIOError("Query parameter is required", 400);
    }
    query = Query.parseStringToObject(options.query);
    if (query.type === undefined) {
      throw new jIO.util.jIOError("Query must be SimpleQuery or ComplexQuery",
                                    400);
    }
    return new RSVP.Queue()
      .push(function () {
        var token;
        var search;

        if (query.type === "simple") {
          search = query.value;
          token = "";
        } else {
          search = getValue(query.query_list, "q");
          token = getValue(query.query_list, "token");
        }
        return jIO.util.ajax({
          "type": "GET",
          "url": ALLDOCS_TEMPLATE.expand({
            "dataset": data_set,
            "search": search,
            "start": token
          })
        });
      })
      .push(function (data) {
        var obj = JSON.parse(data.target.response || data.target.responseText),
          i;
        for (obj.records = obj.records || [], i = 0; i < obj.records.length; i += 1) {
          obj.records[i].value = {};
        }
        obj.records.nhits = obj.nhits;
        return obj.records;

      }, handleError);
  };

  jIO.addStorage('ods_storage', ODSStorage);

}(jIO, RSVP, UriTemplate, JSON, Query));
