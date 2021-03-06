
function divElementEnostavniTekst(sporocilo) {

  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    var sporocila = sporocilo.split(" ");
    var koncnoSporocilo = sporocilo;
    
      sporocilo = filtirirajVulgarneBesede(koncnoSporocilo);
      klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
      $('#sporocila').append(divElementEnostavniTekst(sporocilo));
      $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
      
    for (var i=0; i<sporocila.length; i++) {
      sporocilo = sporocila[i];
      if ((sporocilo.indexOf('http://')==0 || sporocilo.indexOf('https://')==0) && (sporocilo.indexOf('.jpg')>0 || 
          sporocilo.indexOf('.png')>0) || sporocilo.indexOf('.gif')>0) {
        $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
        $('#sporocila').append('<img src="'+ sporocilo + '">');
      } 
      if (sporocilo.indexOf('https://www.youtube.com/watch?v=')==0) {
        var video = sporocilo.substr(sporocilo.indexOf('v=') + 2, sporocilo.length); //najde ta v= v http 
        //naslovu in preskoci ta dva znaka in vzame ven tist string, ki potem sledi
        $('#sporocila').append('<iframe src="https://www.youtube.com/embed/' + video + '" allowfullscreen></iframe>');
      }
    }
  }

  $('#poslji-sporocilo').val('');
}
  
var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    sporocilo = sporocilo.besedilo;

    sporocila = sporocilo.split(" ");
    
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    for (var i=0; i<sporocila.length; i++) {
      sporocilo = sporocila[i];
      if ((sporocilo.indexOf('http://')==0 || sporocilo.indexOf('https://')==0) && (sporocilo.indexOf('.jpg')>0 || 
          sporocilo.indexOf('.png')>0) || sporocilo.indexOf('.gif')>0) {
        $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
        $('#sporocila').append('<img src="'+ sporocilo + '">');
      } 
      if (sporocilo.indexOf('https://www.youtube.com/watch?v=')==0) {
        var video = sporocilo.substr(sporocilo.indexOf('v=') + 2, sporocilo.length); //najde ta v= v http 
        //naslovu in preskoci ta dva znaka in vzame ven tist string, ki potem sledi
        $('#sporocila').append('<iframe src="https://www.youtube.com/embed/' + video + '" allowfullscreen></iframe>');
      }
    }
    
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }
  
    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      /*if (pobarvaniUporabniki.indexOf(uporabniki[i]) > -1) {
        $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i], true));
      } else {*/
        $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
      //}
    }
    
    $('#seznam-uporabnikov div').click(function() {
       var klik = $(this).text();
        //alert(klik);
        //pobarvaniUporabniki = [];
        //pobarvaniUporabniki.push(klik);
        $('#poslji-sporocilo').val('/zasebno' + ' ' + '"' + klik + '"' + ' ');
        $('#poslji-sporocilo').focus();
        $(this).css("background-color", "#ddd");
        
    });
  });
  
  //to vse se dogaja samo na kanalu dregljaj --> prejemnik dregljaja mora biti pridruzen temu kanalu, ce ne, dregljaja ne bo prejel
  socket.on('dregljaj', function(dregljaj) {
    //console.log("ablee", dregljaj);
    //if (trenutniKanal == "dregljaj" /*true*/) {
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setTimeout(function(){$('#vsebina').trigger('stopRumble');}, 1500);
    //} 
      
  });


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
