/*jslint nomen: true, indent: 2, maxlen: 80 */
/*global window, rJS, RSVP, Papa, Boolean, Math, SimpleQuery, Query, JSON, UriTemplate */
(function (window, rJS, RSVP, Papa, Boolean, Math, SimpleQuery, Query, JSON, UriTemplate) {
  "use strict";

  // commune info fetched from opendatasoft
  // https://public.opendatasoft.com/explore/dataset/annuaire-de-ladministration-base-de-donnees-locales/api/?refine.pivotlocal=Mairie
  // dataset 1e tour elections
  // https://www.data.gouv.fr/fr/datasets/elections-municipales-2020-resultats-1er-tour/

  /* sample record created
    [{
     "id": "456",
     "title": "Foo",
     "parent_id": "123",
     "parent_title": "abc",
     "candidate_list": [{
       "panneaux": "1",
       "code_nuance": "ACB",
       "libellé_nuance": "Foobar",
       "sexe": "M",
       "mom": "Ada",
       "prénom": "Foo",
       "liste": "MYNAME"
     }, {...}]
     "bureau_list": [{
        "bureau_id": "12",
        "bureau_ltg_lng": undefined,
        "bureau_title": undefined,
        "inscrit": "123",
        "abstentions": "123"
        ...
        "result_list": [{
          "nom", "abc"
          "prenom": "foo",
          "liste": "MYNAME",
          "voix": "xxx",
          "% voix/ens": "123",
          "% voix/exp": "1245"
        }, {...}]
     }]
    }]
  */

  /////////////////////////////
  // parameters
  /////////////////////////////
  var NAME = "name";
  var DISABLED = "disabled";
  var CRUNCHER = "cruncher_jio";
  var SETTING = "setting_jio";
  var ARR = [];
  var TITLE = "title";
  var COMMUNE = "commune";
  var FACEBOOK = "facebook";
  var ID = "id";
  var REGION = "region";
  var DEPT = "dept";
  var MINUS = "-";
  var PLUS = "+";
  var SPACE = " ";
  var GOOGLE_URL = "https://www.google.com/search?q=";
  var ODS_DATA_SET = "annuaire-de-ladministration-base-de-donnees-locales";
  var ODS = "ods_jio";
  var PREV = "previous_record";
  var NEXT = "next_record";
  var HASH = "#";
  var CANVAS = "canvas";
  var TEN_MINUTES = 600000;
  var THOUSAND = "1000";
  var NINERS = "999";
  var RESET = "Reset";
  var BLANK = "";
  var SELECTED = "selected";
  var RECORDS = " dossiers";
  var CSV = "data:application/csv;charset=utf-8,";
  var CONF = {"delimiter": ";"};

  var DOCUMENT = window.document;
  var LOCATION = window.location;
  var KLASS = rJS(window);
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;

  // google forms for now
  var ILE_DE_FRANCE_REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd" +
    "zIVWy4_YrgSjeia9WCZpdLR_Lv2CsDoLTc86pSJ0WPpyd9w/viewform?usp=pp_url&entr" +
    "y.1765756450=%C3%8Ele-de-France&entry.1669943245={department}&entry.1849" +
    "525071={commune}&entry.1261225401={contact_name}&entry.688373862={contac" +
    "t_email}";
  var ILE_DE_FRANCE_TEMPLATE = UriTemplate.parse(ILE_DE_FRANCE_REPORT_URL);
  var HAUTS_DE_FRANCE_REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQL" +
    "Sd5YfcU0I82C8cKUgz6sDxUQ367wnonIRgYApGskfbzHP5guA/viewform?usp=pp_url&en" +
    "try.1765756450=Hauts-de-France&entry.1669943245={department}&entry.18495" +
    "25071={commune}&entry.1261225401={contact_name}&entry.688373862={contact" +
    "_email}";
  var HAUTS_DE_FRANCE_TEMPLATE = UriTemplate.parse(HAUTS_DE_FRANCE_REPORT_URL);
  var AUVERGNE_RHONE_ALPES_REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQL" +
    "ScXL24_UbK6E1BaFvJfT8RTOhRdALUNnHfyQU-O95GlIZdokg/viewform?usp=pp_url&en" +
    "try.1765756450=Auvergne-Rh%C3%B4ne-Alpes&entry.1669943245={department}&e" +
    "ntry.1849525071={commune}&entry.1261225401={contact_name}&entry.68837386" +
    "2={contact_email}";
  var AUVERGNE_RHONE_ALPES_TEMPLATE = UriTemplate.parse(AUVERGNE_RHONE_ALPES_REPORT_URL);

  // https://fr.wikipedia.org/wiki/R%C3%A9pertoire_national_des_%C3%A9lus
  var NUANCE_DICT = {
    "EXG": "Extrême gauche",
    "COM": "Parti communiste francais",
    "FI": "France insoumise",
    "LFI": "La France insoumise",
    "SOC": "Parti socialiste",
    "RDG": "Parti radical de gauche",
    "GEN": "Génération.s",
    "DVG": "Divers gauche",
    "VEC": "Europe-Ecologie-Les Verts",
    "ANM": "Animalistes",
    "ECO": "Autre écologistes",
    "DIV": "Divers",
    "REG": "Régionalistes",
    "GJ": "Gilets jaunes",
    "REM": "La République en marche",
    "MDM": "Modem",
    "UDI": "Union des démocrates et indépendants",
    "AGR": "Agir",
    "MR": "Mouvement Radical / Social Liberal",
    "DVC": "Divers centre",
    "LR": "Les Républicains",
    "DVD": "Divers droite",
    "DLF": "Debout la France",
    "RN": "Rassemblement national",
    "EXD": "Extrême Droite",
    "NC": "-",
    "LREM": "La Republique en Marche",

    /* Grille <1000 inhabitants */
    "LEXG": "Liste Extrême gauche",
    "LFG": "Liste Front de Gauche",
    "LRDG": "Liste du parti radical de gauche",
    "LGJ": "Liste gilets jaunes",
    "LCOM": "Liste du Parti communiste français",
    "LPG": "Liste du Parti de Gauche",
    "LSOC": "Liste Socialiste",
    "LUG": "Liste Union de la Gauche",
    "LDVG": "Liste Divers gauche",
    "LECO": "Liste Ecologiste",
    "LVEC": "Liste Europe-Ecologie-Les Verts",
    "LDIV": "Liste Divers",
    "LMDM": "Liste Modem",
    "LUC": "Liste Union du Centre",
    "LLR": "Liste Les Républicains",
    "LDVC": "Liste divers centre",
    "LDLF": "Liste Debout la France",
    "LREG": "Liste Régionaliste",
    "LUDI": "Liste Union des Démocrates et des Indépendants",
    "LUMP": "Liste Union pour un Mouvement Populaire",
    "LUD": "Liste Union de la Droite",
    "LDVD": "Liste Divers droite",
    "LFN": "Liste Front National",
    "LRN": "Liste Rassemblement National",
    "LEXD": "Liste Extrême droite",
    "LNC": "-"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function createMappingBasedOnData(my_data) {
    var output = [];
    var len = my_data.length;
    var record;
    var region_title;
    var dict;
    var i;
    var obj;
    var region_list;
    var region;
    var department;

    function getEmptyDict(my_title) {
      return {
        "id": getRegionDepartmentMapping().map(function (region) {
          if (region.title === my_title) {
            return region.id;
          }
        }).filter(Boolean).join(),
        "title": my_title,
        "department_list": [{
          "id": record.parent_id,
          "title": record.parent_title
        }]
      };
    }

    function findRegionDict(item) {
      if (item.title === region_title) {
        return item;
      }
    }

    function findDeptDict(item) {
      return item.title === record.parent_title;
    }

    for (i = 0; i < len; i += 1) {
      record = my_data[i];
      region_title = getRegionFromDepartment(record.parent_title); 
      region_list = output.filter(findRegionDict).filter(Boolean);
      if (region_list.length === 0) {
        region = getEmptyDict(region_title, record);
        output.push(region);
      } else if (!region_list[0].department_list.find(findDeptDict)) {
        region_list[0].department_list.push({
          "id": record.parent_id, "title": record.parent_title
        });
      }
    }
    return output;
  }

  function getRegionDepartmentMapping() {
    return [{
        "id": "84",
        "title": "Auvergne-Rhône-Alpes",
        "department_list": [
          {"id": "01", "title": "Ain"},
          {"id": "03", "title": "Allier"},
          {"id": "07", "title": "Ardèche"},
          {"id": "15", "title": "Cantal"},
          {"id": "26", "title": "Drôme"},
          {"id": "38", "title": "Isère"},
          {"id": "42", "title": "Loire"},
          {"id": "43", "title": "Haute-Loire"},
          {"id": "63", "title": "Puy-de-Dôme"},
          {"id": "69", "title": "Rhône"},
          {"id": "73", "title": "Savoie"},
          {"id": "74", "title": "Haute-Savoie"},
          {"id": "69M", "title": "Métropole Lyon"}
        ]
      },
      {
        "id": "27", 
        "title": "Bourgogne-Franche-Comté",
        "department_list": [ 
          {"id": "21", "title": "Côte-d'Or"},
          {"id": "25", "title": "Doubs"},
          {"id": "39", "title": "Jura"},
          {"id": "58", "title": "Nièvre"},
          {"id": "70", "title": "Haute-Saône"},
          {"id": "71", "title": "Saône-et-Loire"},
          {"id": "89", "title": "Yonne"},
          {"id": "90", "title": "Territoire de Belfort"}
        ]
      },
      {
        "id": "53", 
        "title": "Bretagne",
        "department_list": [ 
          {"id": "22", "title": "Côtes-d'Armor"},
          {"id": "29", "title": "Finistère"},
          {"id": "35", "title": "Ille-et-Vilaine"},
          {"id": "56", "title": "Morbihan"}
        ]
      },
      {
        "id": "24", 
        "title": "Centre-Val de Loire",
        "department_list": [, 
          {"id": "18", "title": "Cher"},
          {"id": "28", "title": "Eure-et-Loir"},
          {"id": "36", "title": "Indre"},
          {"id": "37", "title": "Indre-et-Loire"},
          {"id": "41", "title": "Loir-et-Cher"},
          {"id": "45", "title": "Loiret"}
        ]
      },
      {
        "id": "94", 
        "title": "Corse",
        "department_list": [ 
          {"id": "2A", "title": "Corse-du-Sud"},
          {"id": "2B", "title": "Haute-Corse"}
        ]
      },
      {
        "id": "44", 
        "title": "Grand Est",
        "department_list": [ 
          {"id": "08", "title": "Ardennes"},
          {"id": "10", "title": "Aube"},
          {"id": "51", "title": "Marne"},
          {"id": "52", "title": "Haute-Marne"},
          {"id": "54", "title": "Meurthe-et-Moselle"},
          {"id": "55", "title": "Meuse"},
          {"id": "57", "title": "Moselle"},
          {"id": "67", "title": "Bas-Rhin"},
          {"id": "68", "title": "Haut-Rhin"},
          {"id": "88", "title": "Vosges"}
        ]
      },
      {
        "id": "32", 
        "title": "Hauts-de-France",
        "department_list": [ 
          {"id": "02", "title": "Aisne"},
          {"id": "59", "title": "Nord"},
          {"id": "60", "title": "Oise"},
          {"id": "62", "title": "Pas-de-Calais"},
          {"id": "80", "title": "Somme"}
        ]
      },
      {
        "id": "11", 
        "title": "Île-de-France",
        "department_list": [ 
          {"id": "75", "title": "Paris"},
          {"id": "77", "title": "Seine-et-Marne"},
          {"id": "78", "title": "Yvelines"},
          {"id": "91", "title": "Essonne"},
          {"id": "92", "title": "Hauts-de-Seine"},
          {"id": "93", "title": "Seine-Saint-Denis"},
          {"id": "94", "title": "Val-de-Marne"},
          {"id": "95", "title": "Val-d'Oise"}
        ]
      },
      {
        "id": "28", 
        "title": "Normandie",
        "department_list": [ 
          {"id": "14", "title": "Calvados"},
          {"id": "27", "title": "Eure"},
          {"id": "50", "title": "Manche"},
          {"id": "61", "title": "Orne"},
          {"id": "76", "title": "Seine-Maritime"}
        ]
      },
      {
        "id": "75", 
        "title": "Nouvelle-Aquitaine",
        "department_list": [ 
          {"id": "16", "title": "Charente"},
          {"id": "17", "title": "Charente-Maritime"},
          {"id": "19", "title": "Corrèze"},
          {"id": "23", "title": "Creuse"},
          {"id": "24", "title": "Dordogne"},
          {"id": "33", "title": "Gironde"},
          {"id": "40", "title": "Landes"},
          {"id": "47", "title": "Lot-et-Garonne"},
          {"id": "64", "title": "Pyrénées-Atlantiques"},
          {"id": "79", "title": "Deux-Sèvres"},
          {"id": "86", "title": "Vienne"},
          {"id": "87", "title": "Haute-Vienne"}
        ]
      },
      {
        "id": "76", 
        "title": "Occitane",
        "department_list": [ 
          {"id": "09", "title": "Ariège"},
          {"id": "11", "title": "Aude"},
          {"id": "12", "title": "Aveyron"},
          {"id": "30", "title": "Gard"},
          {"id": "31", "title": "Haute-Garonne"},
          {"id": "32", "title": "Gers"},
          {"id": "34", "title": "Hérault"},
          {"id": "46", "title": "Lot"},
          {"id": "48", "title": "Lozère"},
          {"id": "65", "title": "Hautes-Pyrénées"},
          {"id": "66", "title": "Pyrénées-Orientales"},
          {"id": "81", "title": "Tarn"},
          {"id": "82", "title": "Tarn-et-Garonne"}
        ]
      },
      {
        "id": "52", 
        "title": "Pays de la Loire",
        "department_list": [ 
         {"id": "44", "title": "Loire-Atlantique"},
         {"id": "49", "title": "Maine-et-Loire"},
         {"id": "53", "title": "Mayenne"},
         {"id": "72", "title": "Sarthe"},
         {"id": "85", "title": "Vendée"}
        ]
      },
      {
        "id": "93", 
        "title": "Provence-Alpes-Côte d'Azur",
        "department_list": [ 
          {"id": "04", "title": "Alpes-de-Haute-Provence"},
          {"id": "05", "title": "Hautes-Alpes"},
          {"id": "06", "title": "Alpes-Maritimes"},
          {"id": "13", "title": "Bouches-du-Rhône"},
          {"id": "84", "title": "Var et Vaucluse"}
        ]
      },
      {
        "id": "01", 
        "title": "Guadeloupe",
        "department_list": [ 
          {"id": "971", "title": "Guadeloupe"}
        ]
      },
      {
        "id": "02", 
        "title": "Martinique",
        "department_list": [ 
          {"id": "972", "title": "Martinique"}
        ]
      },
      {
        "id": "03", 
        "title": "Guyane",
        "department_list": [ 
          {"id": "973", "title": "Guyane"}
        ]
      },
      {
        "id": "04", 
        "title": "La Réunion",
        "department_list": [ 
          {"id": "974", "title": "La Réunion"}
        ]
      },
      {
        "id": "06", 
        "title": "Mayotte",
        "department_list":[ 
          {"id": "976", "title": "Mayotte"}
        ]
      }
    ];   
  }

  function getOdsConfig(my_data_set) {
    return {
      "type": "ods_storage",
      "data_set": my_data_set
    };
  }

  function getCruncherConfig() {
    return {
      "type": "indexeddb",
      "database": "cruncher"
    };    
  }

  function getPapaConfig() {
    return {
      "delimiter": ";",
      "header": "true",
      "dynamicTyping": undefined,
      "skipEmptyLines": undefined,
      "preview": undefined,
      "step": undefined,
      "encoding": "ISO-8859-1",
      "worker": true,
      "comments": undefined,
      "download": undefined 
    };
  }

  function getNuance(my_key, rec) {
    // debug raw file
    //if (!my_key) {
    //  console.log("no key", rec);
    //}
    //if (!NUANCE_DICT[my_key]) {
    //  console.log("missing:", my_key, rec);
    //}
    return NUANCE_DICT[my_key] || ("XXX " + my_key + " XXX");    
  }

  function getRegionFromDepartment(my_dept_title) {
    return getRegionDepartmentMapping().map(function (region) {
      return region.department_list.map(function(department) {
        if (my_dept_title === department.title) {
          return region.title; 
        }
      }).filter(Boolean).join(BLANK);
    }).filter(Boolean).join(BLANK);   

  }

  function getRegionDict(my_id, my_dict) {
    return my_dict.map(function(region_dict) {
      if (region_dict.id === my_id) {
        return region_dict;
      }
    }).filter(Boolean);
  }

  function getRelevantIdList(my_state) {
    return getRegionDepartmentMapping().map(function (region) {
      if (my_state.filter_region === region.id) {
        return region.department_list.map(function (department) {
          if (my_state.filter_department) {
            if (my_state.filter_department === departement.id) {
              return department.id;
            }
          }
          return department.id;
        }).filter(Boolean);
      }  
    }).filter(Boolean);
  }

  function getGoogleSearchUrl(my_title, my_keyword) {
    return GOOGLE_URL + my_title.split(SPACE).join(PLUS) + SPACE + my_keyword;
  }

  function getReportUrl(my_record, my_commune, my_candidate) {
    var template;
    switch (my_commune.fields.nom_reg) {
      case "HAUTS-DE-FRANCE":
        template = HAUTS_DE_FRANCE_TEMPLATE;
        break;
      case "AUVERGNE-RHONE-ALPES":
        template = AUVERGNE_RHONE_ALPES_TEMPLATE;
        break;
      case "ILE-DE-FRANCE":
        template = ILE_DE_FRANCE_TEMPLATE;
        break;
    }
    if (template === undefined) {
      return BLANK;
    }
    return template.expand({
      "department": my_record.parent_title,
      "commune": my_record.title,
      "contact_name": my_candidate ? my_candidate.nom : BLANK,
      "contact_email": my_candidate ? BLANK : my_commune.fields.coordonneesnum_email
    });
  }

  function clean(str) {
    return str.split(SPACE).map(function (element) {
      return encode(element);
    }).join(PLUS);
  }

  function encode(str) {
    return window.encodeURIComponent(str);
  }

  function decode(str) {
    return window.decodeURIComponent(str);
  }

  function setSorting(my_sort, my_value) {
    var jump;

    if (my_sort === undefined || my_value === undefined) {
      return TITLE;
    }

    // Note:
    // id and -id length will be rounded to 0 while title and -title will be 1
    // if 0=0 or 1=1, we stay with whatever we have, else we switch
    jump = Math.round(my_sort.length/10) !== Math.round(my_value.length/10);
    switch (my_sort) {
      case TITLE:
        return jump ? ID : (MINUS + TITLE);   
      case (MINUS+TITLE):
        return jump ? ID : TITLE;
      case ID:
        return jump ? TITLE : (MINUS + ID);
      case (MINUS+ID):
        return jump ? TITLE : ID;
    }
  }

  // original dataset has 577 columns
  // columns 0-3 commune info
  // columns 4-18 bureau de vote
  // columns 19-577 candidate, each 9 fields, so 62 candidates possible in total
  function churnThroughDataSet(my_data) {
    var i;
    var len = my_data.length;
    var output = [];
    var current_record;
    var record;

    function addRecord(entry) {
      return {
        "id": entry[2],
        "title": entry[3],
        "parent_id": entry[0],
        "parent_title": entry[1],
        "candidate_list": [],
        "bureau_list": [],
      };
    }

    function addCandidateList(active_record, new_record) {
      var i;
      for (i = 0; i < 557; i += 9) {
        if (new_record[i+19] !== BLANK) {
          active_record.candidate_list.push({
            "panneaux": new_record[i+19],
            "code_nuance": new_record[i+20],
            "libelle_nuance": getNuance(new_record[i+20], record),
            "sexe": new_record[i+21],
            "nom": new_record[i+23] + SPACE + new_record[i+22],
            "liste": new_record[i+24],
          });
        }
      }
    }

    function addBureau(active_record, new_record) {
      active_record.bureau_list.push({
        "bureau_id": new_record[4],
        "bureau_latlng": BLANK,
        "bureau_title": BLANK,
        "inscrits": new_record[5],
        "abstentions": new_record[6],
        "% abs/ins": new_record[7],
        "votants": new_record[8],
        "% vot/ins": new_record[9],
        "blancs": new_record[10],
        "% blancs/ins": new_record[11],
        "% blancs/vot": new_record[12],
        "nuls": new_record[13],
        "% nuls/ins": new_record[14],
        "% nuls/vot": new_record[15],
        "exprimés": new_record[16],
        "% exp/ins": new_record[17],
        "% exp/vot": new_record[18],
        "result_list": []
      });
    }

    function addResults(active_record, new_record) {
      var i;
      var last = active_record.bureau_list.length - 1;
      for (i = 0; i < 557; i += 9) {
        if (new_record[i+22] !== BLANK) {
          active_record.bureau_list[last].result_list.push({
            "nom": new_record[i+23] + SPACE + new_record[i+22], 
            "liste": new_record[i+24],
            "voix": new_record[i+25],
            "% voix/ins": new_record[i+26],
            "% voix/exp": new_record[i+27]
          });
        }
      }
    }

    // meh...
    for (i = 1; i < len; i += 1) {
      record = my_data[i];
      if (!current_record) {
        current_record = addRecord(record);
        addCandidateList(current_record, record);
        addBureau(current_record, record);
        addResults(current_record, record);
      } else if (current_record.id === record[2]) {
        addBureau(current_record, record);
        addResults(current_record, record);
      } else if (current_record.id !== record[2]) {
        output.push(current_record);
        current_record = addRecord(record);
        addCandidateList(current_record, record);
        addBureau(current_record, record);
        addResults(current_record, record);
      }
    }
    return output;
  }

  function setCommuneList(my_data, my_placeholder) {
    var name_dict = {};
    var output = BLANK;
    var char;
    
    my_data.sort(dynamicSort(TITLE))
      .map(function (record) {
        var first = record.title[0];
        if (!name_dict[first]) {
          name_dict[first] = [];
        }
        name_dict[first].push(
          getTemplate(KLASS, "commune_entry").supplant({
            "commune_name": record.title,
            "commune_identifier": encode(record.title)
          }));
      });
    
    for (char in name_dict) {
      if (name_dict.hasOwnProperty(char)) {
        output += getTemplate(KLASS, "commune_list").supplant({
          "character": char,
          "commune_list": name_dict[char].join(" | ")
        });
      }      
    }

    setDom(my_placeholder, output, true); 
  }

  function getBureauResultBracket(my_bureau) {
    return getTemplate(KLASS, "commune_election_row").supplant({
      "bureau_number": my_bureau.bureau_id,
      "bureau_title": my_bureau.bureau_title,
      "bureau_latlng": my_bureau.bureau_ltlng,
      "voters_registered": my_bureau.inscrits,
      "voters_participating": my_bureau.votants,
      "voters_blancs": my_bureau.blancs,
      "voters_nuls": my_bureau.nuls,
      "voters_voted": my_bureau.exprimés,
      "percent_voted": my_bureau["% vot/ins"],
      "voters_abstained": my_bureau.abstentions,
      "percent_abstained": my_bureau["% abs/ins"],
      "bureau_result_bracket": my_bureau.result_list.map(function (result) {
        return getTemplate(KLASS, "commune_election_body_cell").supplant({
          "votes": result["% voix/exp"]
        });
      }).join(BLANK)
    });    
  }

  function getCandidateBracket(my_record) {
    return my_record.candidate_list.map(function (candidate) {
      return getTemplate(KLASS, "commune_election_header_cell").supplant({
        "list_name": candidate.liste === BLANK ? candidate.nom : candidate.liste,
        "candidate_name": candidate.liste === BLANK ? BLANK : candidate.nom
      });
    }).join(BLANK);
  }

  function getTotalFromRecord(my_key, my_record, my_candidate, my_percentage) {
    var total_votes = 0;
    var total_inscrits = 0;
    var candidate_votes = 0;

    function setVotesofCandidate(my_dict, my_bureau) {
      return my_bureau.result_list.map(function (bracket) {
        if (bracket.nom === my_dict.nom) {
          candidate_votes += parseInt(bracket.voix, 10);
        }
      }).filter(Boolean).join(BLANK);
    }

    my_record.bureau_list.map(function (bureau) {
      total_inscrits += parseInt(bureau.inscrits, 10);
      total_votes += parseInt(bureau.exprimés, 10);
      if (my_candidate) {
        setVotesofCandidate(my_candidate, bureau);
      }
    });

    if (my_key === "inscrits") {
      return total_inscrits;
    }
    if (my_key === "vote") {
      if (my_candidate) {
        if (my_percentage) {
          return (candidate_votes/total_votes*100).toFixed(2);
        }
        return candidate_votes;
      }
      return total_votes;
    }
  }

  function getTimeStamp() {
    return new window.Date().getTime();
  }

  // ============================== utilities =============================== */
  function setQuery(my_key, my_val) {
    return new SimpleQuery({"key": my_key, "value": my_val, "type": "simple"});
  }

  //https://stackoverflow.com/a/4760279
  function dynamicSort(prop) {
    var sortOrder = 1;
    if (prop[0] === MINUS) {
      sortOrder = -1;
      prop = prop.substr(1);
    }
    return function (a, b) {
      var result = (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
      return result * sortOrder;
    };
  }

  // poor man's templates. thx, http://javascript.crockford.com/remedial.html
  if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
      return this.replace(TEMPLATE_PARSER, function (a, b) {
        var r = o[b];
        return typeof r === "string" || typeof r === "number" ? r : a;
      });
    };
  }

  function setDom(my_node, my_string, my_purge) {
    var faux_element = DOCUMENT.createElement(CANVAS);
    if (my_purge) {
      purgeDom(my_node);
    }
    faux_element.innerHTML = my_string;
    ARR.slice.call(faux_element.children).forEach(function (element) {
      my_node.appendChild(element);
    });
  }

  function purgeDom(my_node) {
    while (my_node.firstChild) {
      my_node.removeChild(my_node.firstChild);
    }
  }

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
  }

  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "filter_region": undefined,
      "filter_department": undefined,
      "filter_sort": undefined,
      "filter_1000": undefined,
      "filter_999": undefined,
      "filter_unhandled": undefined,
      "previous_record": undefined,
      "next_record": undefined,
      "current_record": undefined,
      "record_count": 0,
      "reduced_set": undefined
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function () {
      var gadget = this;
      var element = gadget.element;

      gadget.property_dict = {
        region_select: getElem(element, "#select_region"),
        dept_select: getElem(element, "#select_department"),
        load_btn: getElem(element, ".get_dataset_trigger"),
        download_btn: getElem(element, ".download_current_selection_trigger"),
        download_churned_btn: getElem(element, ".download_churned_selection_trigger"),
        load_btn_off: getElem(element, ".remove_dataset_trigger"),
        record_status: getElem(element, ".load_data_records"),
        commune_container: getElem(element, ".commune_list_container"),
        region_btn: getElem(element, ".add_region_trigger"),
        region_btn_off: getElem(element, ".delete_region_trigger"),
        dept_btn: getElem(element, ".add_dept_trigger"),
        dept_btn_off: getElem(element, ".delete_dept_trigger"),
        sort_id_btn: getElem(element, ".sort_id_trigger"),
        sort_abc_btn: getElem(element, ".sort_abc_trigger"),
        previous_btn: getElem(element, ".list_previous_commune"),
        list_btn: getElem(element, ".list_communes"),
        next_btn: getElem(element, ".list_next_commune"),
        show_1000: getElem(element, ".show_1000_trigger"),
        show_all: getElem(element, ".show_all_trigger"),
        show_unhandled: getElem(element, ".show_unhandled_trigger"),
        show_total: getElem(element, ".show_total_trigger"),
        show_999: getElem(element, ".show_999_trigger")
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // ---------------------- JIO bridge ---------------------------------------
// ---------------------- JIO bridge ---------------------------------------
    .declareMethod("route", function (my_scope, my_call, my_p1, my_p2, my_p3) {
      return this.getDeclaredGadget(my_scope)
        .push(function (my_gadget) {
          return my_gadget[my_call](my_p1, my_p2, my_p3);
        });
    })

    .declareMethod("ods_create", function (my_option_dict) {
      return this.route(ODS, "createJIO", my_option_dict);
    })
    .declareMethod("ods_allDocs", function (my_query) {
      return this.route(ODS, "allDocs", my_query);
    })
    .declareMethod("ods_get", function(my_id) {
      var gadget = this;
      var dict = gadget.property_dict;
      var i;
      var len;

      // yeah, we don't, it's either on the shelf or bad luck
      // return this.route(ODS, "get", my_id);

      for (i = 0; i < dict.search_list.length; i += 1) {
        if (dict.search_list[i].id === my_id) {
          return dict.search_list[i];
        }
      }

      // not found - fake a 404
      throw new jIO.util.jIOError("Cannot find document: " + id, 404);
    })

    .declareMethod("cruncher_create", function (my_option_dict) {
      return this.route(CRUNCHER, "createJIO", my_option_dict);
    })
    .declareMethod("cruncher_repair", function () {
      return this.route(CRUNCHER, "repair");
    })
    .declareMethod("cruncher_allDocs", function (my_option_dict) {
      return this.route(CRUNCHER, "allDocs", my_option_dict);
    })
    .declareMethod("cruncher_put", function (my_id, my_dict) {
      return this.route(CRUNCHER, "put", my_id, my_dict);
    })
    .declareMethod("cruncher_get", function (my_id) {
      return this.route(CRUNCHER, "get", my_id);
    })
    .declareMethod("cruncher_remove", function (my_id) {
      return this.route(CRUNCHER, "remove", my_id);
    })
    .declareMethod("setting_create", function (my_option_dict) {
      return this.route(SETTING, "createJIO", my_option_dict);
    })
    .declareMethod("setting_getAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTING, "getAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_putAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTING, "putAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_removeAttachment", function (my_id, my_tag) {
      return this.route(SETTING, "removeAttachment", my_id, my_tag);
    })

    /*
    // ------------------------- Settings --------------------------------------
    .declareMethod("getSetting", function (my_setting) {
      var gadget = this;
      return gadget.setting_getAttachment("/", my_setting, {format: "text"})
        .push(function (response) {
          var payload = JSON.parse(response);
          if (getTimeStamp() - payload.timestamp > TEN_MINUTES) {
            return gadget.setting_removeAttachment("/", "token");
          }
          return payload[my_setting];
        })
        .push(undefined, function (my_error) {
          return gadget.handleError(my_error, {"404": 0});
        });
    })

    .declareMethod("setSetting", function (my_setting, my_value) {
      var payload = {"timestamp": getTimeStamp()};
      payload[my_setting] = my_value;
      return this.setting_putAttachment("/", my_setting, new Blob([
        JSON.stringify(payload)
      ], {type: "text/plain"}));
    })
    */
    // ------------------------- Connection ------------------------------------
    /*
    .declareMethod("evaluateRemoteConnection", function () {
      var gadget = this;
      return gadget.getSetting("token")
        .push(function (token) {
          return gadget.setRemoteConnection(token);
        });
    })

    .declareMethod("connectOauth", function() {
      var gadget = this;
      return gadget.getDeclaredGadget("oauth")
        .push(function (oauth_gadget) {
          return oauth_gadget.setOauth({
            "type": "facebook",
            "client_id": gadget.property_dict.facebook_id
          });
        })
        .push(function (my_oauth_dict) {
          return gadget.setRemoteConnection(my_oauth_dict.access_token);
        });
    })

    .declareMethod("setRemoteConnection", function (my_token) {
      var gadget = this;
      var dict = gadget.property_dict;

      if (!my_token) {
        // no token
      }

      return gadget.setSetting("token", my_token)
        .push(function () {
          // we can search
        })
        .push(undefined, function (connection_error) {
          throw err;
        });
    })
    */

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict);
      return new RSVP.Queue()
        //.push(function () {
        //  return gadget.evaluateRemoteConnection();
        //})
        .push(function () {
          return gadget.cruncher_create(getCruncherConfig());
        })
        .push(function () {
          return gadget.ods_create(getOdsConfig(ODS_DATA_SET));
        });
    })

    .declareMethod("updateParameterFormList", function (my_element, my_type) {
      var gadget = this;
      var state = gadget.state;
      var id;
      var sort;
      if (my_element) {
        id = my_element.options[my_element.selectedIndex].value;
      }
      switch (my_type) {
        case REGION:
          return gadget.setParameterFormList(id, state.filter_department);
        case DEPT:
          return gadget.setParameterFormList(state.filter_region, id);
        case THOUSAND:
        case NINERS:
        case RESET:
        case TITLE:
        case ID:
          return gadget.setParameterFormList(state.filter_region, state.filter_department, my_type);
        }
    })

    .declareMethod("removeParameterFormList", function (my_type) {
      var gadget = this;
      var state = gadget.state;
      switch (my_type) {
        case REGION:
          return gadget.setParameterFormList();
        case DEPT:
          return gadget.setParameterFormList(state.filter_region);
      }
    })

    .declareMethod("filterDataSet", function (my_data, my_region_list, my_region_id, my_dept_id) {
      var department_list = [];
      var len = my_data.length;
      var reduced_set = [];
      var item;
      var i;

      function getDepartmentIds(department_list) {
        return department_list.map(function (department) {
          if (my_dept_id) {
            if (my_dept_id === department.id) {
              return (parseInt(department.id, 10)).toString();
            }
            return;
          }
          return (parseInt(department.id, 10)).toString();
        }).filter(Boolean);    
      }
  
      department_list = my_region_list.reduce(function (acc, region) {
        if (my_region_id) {
          if (my_region_id === region.id) {
            return acc.concat(getDepartmentIds(region.department_list));
          }
          return;
        }
        return acc.concat(getDepartmentIds(region.department_list));
      }, []).filter(Boolean);

      for (i = 0; i < len; i += 1) {
        item = my_data[i];
        if (department_list.includes(item.parent_id)) {
          reduced_set.push(item);
        }
      }
      return reduced_set;
    })

    .declareMethod("setParameterFormList", function (my_region_id, my_dept_id, my_key) {
      var gadget = this;
      var dict = gadget.property_dict;
      var region_list = [];
      var department_list = [];
      var data_list;
      var queue = new RSVP.Queue();
      var sort_by;

      // non-glory code start!

      // include new filter options
      switch (my_key) {
        case THOUSAND:
          sort_by = setSorting(undefined, undefined);
          queue.push(function () {
            return gadget.stateChange({"filter_1000": my_key});
          });
          break;
        case NINERS:
          sort_by = setSorting(undefined, undefined);
          queue.push(function () {
            return gadget.stateChange({"filter_999": my_key});
          });
          break;
        default:
          sort_by = setSorting(gadget.state.filter_sort, my_key);
          break;
      }

      if(my_key === RESET || my_key === undefined) {
        queue.push(function () {
          return gadget.stateChange({
            "filter_1000": undefined, 
            "filter_all": undefined,
            "filter_999": undefined
          });
        });
      }

      // if a region is specified, we must update departments
      if (my_region_id) {
        data_list = getRegionDict(my_region_id, getRegionDepartmentMapping());  
      } else {
        data_list = createMappingBasedOnData(dict.data_set || ARR);
      }

      if (dict.data_set) {
        queue.push(function () {
            return gadget.filterDataSet(dict.data_set, data_list, my_region_id, my_dept_id);
          })
          .push(function (reduced_set) {
            if (gadget.state.filter_1000 !== undefined) {
              return reduced_set.map(function (record) {
                var total = record.bureau_list.reduce(function (acc, val) {
                  return acc + parseInt(val.inscrits, 10);
                },0);
                if (total > 1000) {
                  return record;
                }
              }).filter(Boolean);
            }
            if (gadget.state.filter_999 !== undefined) {
              return reduced_set.map(function (record) {
                var total = record.bureau_list.reduce(function (acc, val) {
                  return acc + parseInt(val.inscrits, 10);
                },0);
                if (total < 1000) {
                  return record;
                }
              }).filter(Boolean);
            }
            return reduced_set;
          })
          .push(function (reduced_set) {
            setCommuneList(reduced_set, dict.commune_container);
            return gadget.stateChange({
              "record_count": reduced_set.length,
              "reduced_set": reduced_set
            });
          });
      }

      data_list.map(function (region) {
        region_list.push(region);
        department_list = department_list.concat(region.department_list);
      });

      setDom(dict.region_select,
        region_list
          .sort(dynamicSort(sort_by))
          .map(function (region) {
            return getTemplate(KLASS, "configuration_form_option").supplant({
              "value": region.id,
              "name": region.title,
              "selected": (my_region_id && my_region_id === region.id) ? SELECTED : BLANK
            });
          })
          .join(BLANK), true);

      setDom(dict.dept_select,
        department_list
          .sort(dynamicSort(sort_by))
          .map(function (department) {
            return getTemplate(KLASS, "configuration_form_option").supplant({
              "value": department.id,
              "name": department.title,
              "selected": (my_dept_id && my_dept_id === department.id) ? SELECTED : BLANK
            });
          })
          .join(BLANK), true);

      return queue
        .push(function () {
          return gadget.stateChange({
            "filter_region": my_region_id,
            "filter_department": my_dept_id,
            "filter_sort": sort_by,
            "current_record": undefined,
            "previous_record": undefined,
            "next_record": undefined
          });
      });
    })

    .declareMethod("clearDataSet", function (my_event) {
      var gadget = this;
      var dict = gadget.property_dict;
      dict.data_set = null;
      dict.region_btn.setAttribute(DISABLED, DISABLED);
      dict.region_btn_off.setAttribute(DISABLED, DISABLED);
      dict.dept_btn.setAttribute(DISABLED, DISABLED);
      dict.dept_btn_off.setAttribute(DISABLED, DISABLED);
      dict.sort_id_btn.setAttribute(DISABLED, DISABLED);
      dict.sort_abc_btn.setAttribute(DISABLED, DISABLED);
    })

    .declareMethod("ingestDataSet", function (my_event, my_download) {
      var gadget = this;
      var dict = gadget.property_dict;
      var target = my_event.target;
      var file_input;
      var file;
      var parsePapaPromise;
      //var url = LOCATION.href + dict.data_download_url;
      
      if (my_download) {
        file_input = dict.target.get_dataset;
      } else {
        dict.target = target;
        file_input = target.get_dataset;
      }
      file = file_input.files[0];

      if (!file) {
        return;
      }

      parsePapaPromise = function (my_url, my_download_dict) {
        var resolver = function (result_dict) {
          return result_dict;
        };
        var canceller = function (err) {
          throw (err);
        };
        return new RSVP.Promise(function(resolver, canceller) {
          Papa.parse(my_url, {
            "download": true,
            "delimiter": undefined,
            "header": undefined,
            "dynamicTyping": undefined,
            "skipEmptyLines": undefined,
            "preview": undefined,
            "step": undefined,
            "encoding": "ISO-8859-1",
            "worker": true,
            "comments": undefined, 
            "complete": function (result_dict) {
              resolver(result_dict);
            },
            "error": function (err) {
              canceller(err);
            }
          });
        });
      };

      return new RSVP.Queue()
        .push(function () {
          dict.load_btn.setAttribute(DISABLED, DISABLED);
          return parsePapaPromise(file);
        })
        .push(function (result_dict) {
          if (my_download) {
            return gadget.downloadCSV(result_dict);
          }
          dict.data_set = churnThroughDataSet(result_dict.data);
          dict.load_btn.removeAttribute(DISABLED);
          //dict.load_btn_off.removeAttribute(DISABLED);
          //dict.download_btn.removeAttribute(DISABLED);
          //dict.download_churned_btn.removeAttribute("DISABLED");
          dict.region_btn.removeAttribute(DISABLED);
          dict.region_btn_off.removeAttribute(DISABLED);
          dict.dept_btn.removeAttribute(DISABLED);
          dict.dept_btn_off.removeAttribute(DISABLED);
          //dict.sort_id_btn.removeAttribute(DISABLED);
          //dict.sort_abc_btn.removeAttribute(DISABLED);
          dict.show_1000.removeAttribute(DISABLED);
          dict.show_999.removeAttribute(DISABLED);
          dict.show_all.removeAttribute(DISABLED);
          //dict.show_unhandled.removeAttribute(DISABLED);
          //dict.show_total.removeAttribute(DISABLED);
          return RSVP.all([
            gadget.stateChange({"record_count": dict.data_set.length}),
            gadget.setParameterFormList()
          ]);
        })
        .push(null, function (err) {
          throw (err);
        });
    })

    .declareMethod("downloadCSV", function (my_result_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      var state = gadget.state;
      var output = [my_result_dict.data[0]];
      var len = my_result_dict.data.length;
      var i;
      var record;
      var parsePapaPromise;
      var relevant_id_list;
      var download_link;

      // get the list of departments from the current selection (region or dept)
      relevant_id_list = getRelevantIdList(state)[0].map(function (id) {
        return parseInt(id, 10).toString();
      });

      // filter the parsed output by those departments
      for (i = 1; i < len; i += 1) {
        record = my_result_dict.data[i];
        if (relevant_id_list.includes(record[0])) {
          output.push(record); 
        }
      }

      // and convert it back, make sure to include the BOM, else foreign
      // characters will be mangled
      download_link = document.createElement("a");
      download_link.href = CSV + "\ufeff" + encode(Papa.unparse(output, CONF));
      download_link.download = "data.csv";
      document.body.appendChild(download_link);
      download_link.click();
      document.body.removeChild(download_link);
      return;
    })

    .declareMethod("downloadPolishedCsv", function (my_event) {
      var gadget = this;
      var dict = gadget.property_dict;
      var output = [];
      var header;
      var download_link;
      var header_row = [
        "Libellé de la région",
        "Code de la région",
        "Libellé du département",
        "Code du département",
        "Libellé de la commune",
        "Code de la commune",
        "Votants",
        "Inscrits"
      ];
      var i;
      for (i = 0; i < 61; i += 1) {
        header_row.push(
          "Liste",
          "Nom",
          "Libellé Nuance",
          "Code de la Nuance",
          "Votes",
          "Pourcentage",
          "Rechercher sur Google"
        );
      }

      output = dict.data_set.map(function (record) {
        var tail = [];
        var i;
        var data;
        var candidate;
        var region_title = getRegionFromDepartment(record.parent_title)
        var base = [
          region_title,
          getRegionDepartmentMapping().map(function (my_region) {
            if (my_region.title === region_title) {
              return my_region.id;
            }
          }).filter(Boolean)[0],
          record.parent_title,
          record.parent_id,
          record.title,
          record.id,
          getTotalFromRecord("vote", record, null),
          getTotalFromRecord("inscrits", record, null)
        ];
        for (i = 0; i < 61; i += 1) {
          candidate = record.candidate_list[i];
          if (candidate) {
            tail.push(
              candidate.liste,
              candidate.nom,
              candidate.libelle_nuance,
              candidate.nuance,
              getTotalFromRecord("vote", record, candidate),
              getTotalFromRecord("vote", record, candidate, true),
              getGoogleSearchUrl(candidate.liste === BLANK ? candidate.nom : candidate.liste, record.title)
            );
          } else {
            tail.push(BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK);
          }
        }
        data = base.concat(tail);
        data = data.join(";");
        return data;
      });
      output.unshift(header_row.join(";"));
      download_link = document.createElement("a");
      download_link.href = CSV + "\ufeff" + encode(output.join("\r\n"));
      download_link.download = "data.csv";
      document.body.appendChild(download_link);
      download_link.click();
      document.body.removeChild(download_link);
      return;
    })

    .declareMethod("setCommune", function (my_hash) {
      var gadget = this;
      var dict = gadget.property_dict;
      var state = gadget.state;
      var title = decode(my_hash).slice(1);
      var i;
      var data = state.reduced_set || dict.data_set;
      var len = data.length;
      var record;
      var prev;
      var next;

      // find record
      for (i = 0; i < len; i += 1) {
        if (data[i].title === title) {

          // what do I do if there are more than one commune with exactly the same name?
          record = data[i];
          prev = data[i + 1];
          next = data[i - 1];
          break;
        }
      }

      // random hash or misspelled title should not crash
      if (record === undefined) {
        setDom(dict.commune_container, getTemplate(KLASS, "commune_not_found").supplant({
          "hashtag": title
        }), true);
        return;
      }

      return new RSVP.Queue()
        .push(function () {
          var query = setQuery("q", title);
          return gadget.ods_allDocs({"query": Query.objectToSearchText(query)});
        })
        .push(function (result_list) {
          var commune;
          var commune_entry;
          var list_breakdown;
          var result_breakdown;
          if (result_list.data.total_rows === 1) {
            commune = result_list.data.rows[0];
          } else {
            commune = result_list.data.rows.map(function (result_item) {

              // there are too many results, eg Metropole de Lille giving more
              // than 100 results, so we look for the name of the Mairie, which
              // seems to be "Mairie - [Nom]".
              if (result_item.fields.nom.endsWith("- " + record.title)) {
                return result_item;
              }
            }).filter(Boolean)[0];
          }

          commune = commune || {"fields": {}};
          commune_entry = getTemplate(KLASS, "commune_spec").supplant({
            "commune_name": record.title,
            "parent_department": record.parent_title,
            "parent_region": getRegionFromDepartment(record.parent_title),
            "commune_inscrits": getTotalFromRecord("inscrits", record, null),
            //"commune_wikipedia_url": BLANK,
            //"commune_facebook_url": BLANK,
            "google_search_url": getGoogleSearchUrl(record.title, COMMUNE),
            "commune_report_url": getReportUrl(record, commune),
            "ods_nom": commune.fields.nom || BLANK,
            "ods_nom_reg": commune.fields.nom_reg || BLANK,
            "ods_nom_epci": commune.fields.nom_epci || BLANK,
            "ods_nom_dep": commune.fields.nom_dep || BLANK,
            "ods_codeinsee": commune.fields.codeinsee || BLANK,
            "ods_addresse_ligne": commune.fields.addresse_ligne || BLANK,
            "ods_adresse_codepostal": commune.fields.adresse_codepostal || BLANK,
            "ods_adresse_nomcommune": commune.fields.adresse_nomcommune || BLANK,
            "ods_coordonneesnum_url": commune.fields.coordonneesnum_url || BLANK,
            "ods_coordonneesnum_email": commune.fields.coordonneesnum_email || BLANK,
          });
    
          list_breakdown = getTemplate(KLASS, "commune_candidate_list").supplant({
            "candidate_list": record.candidate_list.map(function (candidate) {
              return getTemplate(KLASS, "commune_candidate_list_item").supplant({
                "global_percentage": getTotalFromRecord("vote", record, candidate, true),
                "global_votes": getTotalFromRecord("vote", record, candidate),
                "liste_name": candidate.liste,
                "head_name": candidate.nom,
                "nuance": candidate.libelle_nuance,
                //"facebook_url": BLANK
                "google_search_url": getGoogleSearchUrl(candidate.liste === BLANK ? candidate.nom : candidate.liste, record.title),
                "commune_report_url": getReportUrl(record, commune, candidate),
              });
            }).join(BLANK)
          });
    
          result_breakdown = getTemplate(KLASS, "commune_election_table").supplant({
            "candidate_bracket": getCandidateBracket(record),
            "commune_result_bracket": record.bureau_list.map(function (bureau) {
              return getBureauResultBracket(bureau);
            }).join(BLANK)
          });
    
          setDom(dict.commune_container, [commune_entry, list_breakdown, result_breakdown].join(BLANK), true);
          dict.previous_btn.removeAttribute(DISABLED);
          dict.list_btn.removeAttribute(DISABLED);
          dict.next_btn.removeAttribute(DISABLED);
    
          return gadget.stateChange({
            "previous_record": prev,
            "next_record": next,
            "current_record": record
          });
        })
        .push(undefined, function (err) {
          throw err;
        });
    })

    .declareMethod("populateStorage", function (my_data) {
      var gadget = this;
      var promise_list = [];

      return RSVP.all(promise_list);
    })

    .declareMethod("resetCommuneList", function () {
      var gadget = this;
      var state = gadget.state;
      return gadget.setParameterFormList(
        state.filter_region,
        state.filter_department,
        state.filter_sort
      );
    })

    .declareMethod("updateHash", function (my_param) {
      var gadget = this;
      var target = gadget.state[my_param === -1 ? PREV : NEXT];
      if (!target) {
        return gadget.resetCommuneList();
      }
      LOCATION.hash = HASH + encode(target.title);
      return;
    })

    // ------------------------ Statechange ------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var element = gadget.element;
      var dict = gadget.property_dict;
      var state = gadget.state;
      var promise_list = [];
      if (delta.hasOwnProperty("filter_region")) {
        state.filter_region = delta.filter_region;
      }
      if (delta.hasOwnProperty("filter_1000")) {
        state.filter_1000 = delta.filter_1000;
      }
      if (delta.hasOwnProperty("filter_999")) {
        state.filter_999 = delta.filter_999;
      }
      if (delta.hasOwnProperty("filter_department")) {
        state.filter_department = delta.filter_department;
      }
      if (delta.hasOwnProperty("filter_sort")) {
        state.filter_sort = delta.filter_sort;
      }
      if (delta.hasOwnProperty("previous_record")) {
        state.previous_record = delta.previous_record;
      }
      if (delta.hasOwnProperty("next_record")) {
        state.next_record = delta.next_record;
      }
      if (delta.hasOwnProperty("current_record")) {
        state.current_record = delta.current_record;
      }
      if (delta.hasOwnProperty("record_count")) {
        dict.record_status.textContent = delta.record_count + RECORDS;
      }
      if (delta.hasOwnProperty("reduced_set")) {
        state.reduced_set = delta.reduced_set;
      }
      return RSVP.all(promise_list);
    })

    /*
    // ------------------------ Errors -----------------------------------------
    .declareMethod("handleError", function (my_err, my_err_dict) {
      var gadget = this;
      var code;
      var err = my_err.target ? JSON.parse(my_err.target.response).error : my_err;

      //if (err instanceof RSVP.CancellationError) {
      //  return gadget.stateChange({"loader": null});
      //}

      for (code in my_err_dict) {
        if (my_err_dict.hasOwnProperty(code)) {
          if ((err.status_code + BLANK) === code) {
            return my_err_dict[code];
          }
        }
      }
      throw err;
    })
    */

    /////////////////////////////
    // declared jobs
    /////////////////////////////

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var gadget = this;
      var listener = window.loopEventListener;
      function handleHash() {
        if (LOCATION.hash === BLANK) {
          return gadget.resetCommuneList();
        }
        return gadget.setCommune(LOCATION.hash);
      }
      return RSVP.all([
        //gadget.setting_create({"type": "local", "sessiononly": false}),
        listener(window, "hashchange", false, handleHash),
      ]);
    })

    /////////////////////////////
    // on Event
    /////////////////////////////
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "connect_facebook":
          return this.connectOauth();
        case "get_data":
          return this.ingestDataSet(event);
        case "remove_data":
          return this.clearDataSet(event);
        case "download_current_selection":
          return this.ingestDataSet(event, true);
        case "download_churned_selection":
          return this.downloadPolishedCsv(event);
        case "set_region_filter":
          return this.updateParameterFormList(event.target.select_region, REGION);
        case "remove_region_filter":
          return this.removeParameterFormList(REGION);
        case "set_department_filter":
          return this.updateParameterFormList(event.target.select_department, DEPT);
        case "remove_department_filter":
          return this.removeParameterFormList(DEPT);
        case "list_by_name":
          return this.updateParameterFormList(null, TITLE);
        case "list_by_id":
          return this.updateParameterFormList(null, ID);
        case "show_previous_commune":
          return this.updateHash(1);
        case "show_1000":
          return this.updateParameterFormList(null, THOUSAND);
        case "show_999":
          return this.updateParameterFormList(null, NINERS)
        case "show_all":
          return this.updateParameterFormList(null, RESET);
        case "list_communes":
          return this.resetCommuneList();
        case "show_next_commune":
          return this.updateHash(-1);
      }
    }, false, true);

}(window, rJS, RSVP, Papa, Boolean, Math, SimpleQuery, Query, JSON, UriTemplate));