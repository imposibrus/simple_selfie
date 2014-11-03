
var SelfieApp = new Backbone.Marionette.Application();

SelfieApp.addRegions({
  images: '#images_list',
  gallery: '#gallery_list',
  main: '#main'
});

SelfieApp.module('Gallery', function(Gallery) {
  var galleryModel = Backbone.Model.extend({
    defaults: {
      src: 'asd'
    }
  });

  var galleryCollection = Backbone.Collection.extend({
    model: galleryModel
  });

  var galleryItemView = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'item',
    template: '#gallery_item_template',
    model: galleryModel
  });

  Gallery.Collection = new galleryCollection();

  var galleryCollectionView = Marionette.CollectionView.extend({
    tagName: 'ul',
    className: 'gallery_list sidebar_list',
    collection: Gallery.Collection,
    childView: galleryItemView
  });

  Gallery.CollectionView = new galleryCollectionView();
});

SelfieApp.module('Images', function(Images) {
  var imageModel = Backbone.Model.extend({
    defaults: {
      src: '/images/image_1.jpg'
    }
  });

  var imagesCollection = Backbone.Collection.extend({
    model: imageModel
  });

  var imageView = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'item',
    template: '#images_item_template',
    model: imageModel,
    events: {
      'click img': 'addToCanvas'
    },
    addToCanvas: function() {
      console.log(this.model);
    }
  });

  Images.Collection = new imagesCollection();

  [1, 2, 3, 4].forEach(function(num) {
    Images.Collection.add({src: '/images/image_' + num + '.jpg'});
  });

  var imagesCollectionView = Marionette.CollectionView.extend({
    tagName: 'ul',
    className: 'images_list sidebar_list',
    childView: imageView,
    collection: Images.Collection
  });

  Images.CollectionView = new imagesCollectionView();
});

SelfieApp.addInitializer(function() {
  SelfieApp.gallery.show(SelfieApp.Gallery.CollectionView);
  SelfieApp.images.show(SelfieApp.Images.CollectionView);
});

SelfieApp.start();

$(function() {
  $('#girl_draggable').draggable();
  $( "#girl" ).resizable();

  $(document).on('click', '#download-btn', function() {
    this.href = document.getElementById('canvas').toDataURL();
    this.download = 'asd.png';
  });
});




// Take a screenshot using getUserMedia API.
// Give credit where credit is due. The code is heavily inspired by 
// HTML5 Rocks' article "Capturing Audio & Video in HTML5" 
// http://www.html5rocks.com/en/tutorials/getusermedia/intro/
(function() {

  // Our element ids.
  var options = {
    video: '#video',
    canvas: '#canvas',
    captureBtn: '#capture-btn',
    imageURLInput: '#image-url-input'
  };

  // Our object that will hold all of the functions.
  var App = {
    // Get the video element.
    video: document.querySelector(options.video),
    // Get the canvas element.
    canvas: document.querySelector(options.canvas),
    // Get the canvas context.
    ctx: canvas.getContext('2d'),
    // Get the capture button.
    captureBtn: document.querySelector(options.captureBtn),
    // This will hold the video stream.
    localMediaStream: null,
    // This will hold the screenshot base 64 data url.
    dataURL: null,
    // This will hold the converted PNG url.
    imageURL: null,
    // Get the input field to paste in the imageURL.
    imageURLInput: document.querySelector(options.imageURLInput),
    happyStartTime: false,
    happyCounter: document.getElementById('happy_counter'),

    initialize: function() {
      var that = this;
      // Check if navigator object contains getUserMedia object.
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      // Check if window contains URL object.
      window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

      // Check for getUserMedia support.
      if (navigator.getUserMedia) {
        // Get video stream.
        navigator.getUserMedia({
          video: true
        }, _.bind(this.gotStream, this), _.bind(this.noStream, this));

        // Bind capture button to capture method.
        this.captureBtn.onclick = function () {
          that.capture();
        };
      } else {
        // No getUserMedia support.
        alert('Your browser does not support getUserMedia API.');
      }
      //var vid = document.getElementById('video');
      this.ctrack = new clm.tracker({useWebGL : true});
      this.ctrack.init(pModel);

      this.ec = new emotionClassifier();
      this.ec.init(emotionModel);
    },

    // Stream error.
    noStream: function (err) {
      alert('Could not get camera stream.');
      console.log('Error: ', err);
    },

    // Stream success.
    gotStream: function (stream) {
      this.video.addEventListener('canplay', _.bind(this.startVideo, this), false);
      // Feed webcam stream to video element.
      // IMPORTANT: video element needs autoplay attribute or it will be frozen at first frame.
      if (window.URL) {
        this.video.src = window.URL.createObjectURL(stream);
      } else {
        this.video.src = stream; // Opera support.
      }

      $('#canvas').css({width: this.video.width, height: this.video.height});
      // Store the stream.
      this.localMediaStream = stream;
    },

    startVideo: function() {
      // start video
      this.video.play();
      // start tracking
      this.ctrack.start(this.video);
      // start loop to draw face
      this.drawLoop();
    },

    drawLoop: function() {
      requestAnimFrame(_.bind(this.drawLoop, this));
      var cp = this.ctrack.getCurrentParameters();

      var er = this.ec.meanPredict(cp);
      if (er) {
        var happy = er.slice(-1)[0];
        if(happy.emotion == 'happy' && happy.value > 0.3) {
          if(!this.happyStartTime) {
            this.happyStartTime = Date.now();
          } else {
            var seconds = new Date(Date.now() - this.happyStartTime).getSeconds();
            if(seconds >= 1) {
              this.happyCounter.style.display = 'block';
            }
            this.happyCounter.innerHTML = seconds > 3 ? 'Птичка!' : Math.abs(3 - seconds);
          }

          if(Date.now() - this.happyStartTime > 4000) {
            // take a photo!
            this.capture();
            //$('#download-btn').trigger('click');
            this.happyStartTime = false;
          }
        } else {
          this.happyCounter.style.display = 'none';
          this.happyStartTime = false;
        }
      }
    },

    // Capture frame from live video stream.
    capture: function () {
      var that = this;
      // Check if has stream.
      if (this.localMediaStream) {
        // Draw whatever is in the video element on to the canvas.
        that.ctx.drawImage(this.video, 0, 0);
        var image = new Image(),
            $girlImage = $('#girl'),
            $girlWrp = $('#girl_draggable');

        image.onload = function() {
          that.ctx.drawImage(
              image,
              ~~$girlWrp.css('left').replace(/\D+/, ''),
              ~~$girlWrp.css('top').replace(/\D+/, ''),
              ~~$girlImage.css('width').replace(/\D+/, ''),
              ~~$girlImage.css('height').replace(/\D+/, '')
          );

          SelfieApp.Gallery.Collection.add({src: document.getElementById('canvas').toDataURL()});

        };
        image.src = $girlImage.attr('src');

        // Create a data url from the canvas image.
        //dataURL = canvas.toDataURL('image/png');
        // Call our method to save the data url to an image.
        //that.saveDataUrlToImage();
      }
    }/*,

    saveDataUrlToImage: function () {
      var that = this;
      var options = {
        // Change this to your own url.
        url: 'http://example.com/dataurltoimage'
      };

      // Only place where we need jQuery to make an ajax request
      // to our server to convert the dataURL to a PNG image,
      // and return the url of the converted image.
      that.imageURLInput.value = 'Fetching url ...';
      $.ajax({
        url: options.url,
        type: 'POST',
        dataType: 'json',
        data: { 'data_url': dataURL },
        complete: function(xhr, textStatus) {
          // Request complete.
        },
        // Request was successful.
        success: function(response, textStatus, xhr) {
          console.log('Response: ', response);
          // Conversion successful.
          if (response.status_code === 200) {
            imageURL = response.data.image_url;
            // Paste the PNG image url into the input field.
            that.imageURLInput.value = imageURL;
            that.imageURLInput.removeAttribute('disabled');
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          // Some error occured.
          console.log('Error: ', errorThrown);
          imageURLInput.value = 'An error occured.';
        }
      });
    }*/

  };

  // Initialize our application.
  App.initialize();

  // Expose to window object for testing purposes.
  window.App = App;

})();



