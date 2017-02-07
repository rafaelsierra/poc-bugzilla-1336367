// vim: set et ts=2 sw=2:
window.addEventListener('load', function(){
  'use strict';

  var startBtn = document.getElementById('start');
  var stopBtn = document.getElementById('stop');
  var videoPlayer = document.querySelector('video');

  // Determines the media constrains
  var mediaConstraints = (function(){
    var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    
    var response = {
      audio: {channelCount: 1},
      video: {},  
    };

    if(supportedConstraints.width){
      response.video.width = 1280;
    }
    if(supportedConstraints.height){
      response.video.height = 720;
    }
    if(supportedConstraints.frameRate){
      response.video.frameRate = 24;
    }
    return response;
  })();
  console.log('Using media constraints', mediaConstraints);

  // Determines the mimetype
  var mimeType = (function(){
    var types = [
      "video/webm",
      "audio/webm", 
      "video/webm\;codecs=vp8", 
      "video/webm\;codecs=daala", 
      "video/webm\;codecs=h264", 
      "audio/webm\;codecs=opus", 
      "video/mpeg"
    ];
    for(var type of types){
      if(MediaRecorder.isTypeSupported(type)){
        return type;
      }
    }
  })(); 
  console.log('Using mimeType', mimeType);

  startBtn.addEventListener('click', function(){
    console.log('Asking for access to devices');
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(mediaStream){
      console.log('Access granted');
      // Display the webcam input back to the user 
      videoPlayer.src = URL.createObjectURL(mediaStream);
      videoPlayer.volume = 0;
      videoPlayer.muted = true;
      videoPlayer.play();

      // Creates the audio context to be used to recordo
      var audioContext = new AudioContext();
      var mediaStreamAudioSource = audioContext.createMediaStreamSource(mediaStream);
      var micDestination = audioContext.createMediaStreamDestination();
      var volumeGainNode = audioContext.createGain();
      volumeGainNode.gain.value = 0.5; // This is used to control the recording mic volume

      mediaStreamAudioSource.connect(volumeGainNode);

      // Creates a new stream using the audio context above      
      var recordingStream = new MediaStream();
      recordingStream.addTrack(mediaStream.getVideoTracks()[0]);
      recordingStream.addTrack(micDestination.stream.getAudioTracks()[0]);
      
      var recorder = new MediaRecorder(
        recordingStream,
        {
          mimeType: mimeType,
          audioBitsPerSecond: 128000, // ~128kbps
          videoBitsPerSecond: 750000, // ~750kbps
        }
      );

      var chunkCounter = 0;
      recorder.addEventListener('dataavailable', function(blobEvent){
        // The following setTimeout replaces the avg range time it takes to upload the blob data
        var formData = new FormData(); 
        formData.append('video', blobEvent.data);
        formData.append('counter', chunkCounter++);
        console.log('Uploading video piece', formData.get('counter'), 'with size', blobEvent.data.size);
        setTimeout(function(){
          console.log('Video piece', formData.get('counter'), 'upload');
        }, Math.random()*(5000-1000)+1000); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#Getting_a_random_number_between_two_values
      });
      console.log('Starting recording');
      recorder.start(3000);


      var stopRecording = function(){
        console.log('Stopping recording');
        recorder.stop();
      }
      stopBtn.removeEventListener('click', stopRecording);
      stopBtn.addEventListener('click', stopRecording);

    }).catch(function(){
      console.error('Could not getUserMedia', arguments);
    }); 
  });
});
