(function() {

  let onDOMContentLoaded = function() {

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    let context = new AudioContext();
    let source = null;

    let trigger = function() {
      let event = document.createEvent('Event');
      event.initEvent('ended', true, true);

      if (source instanceof AudioBufferSourceNode) {
          source.dispatchEvent(event);
      }
    };

    let startAudio = function(arrayBuffer) {

      let successCallback = function(audioBuffer) {
      // audioBufferはAudioBufferのインスタンス
        // 第１引数
        // sourceに音源が格納されている場合は、sourceを空にする
        if ((source instanceof AudioBufferSourceNode) && (source.buffer instanceof AudioBuffer)) {
          trigger();
          source = null;
        };

        // AudioBufferSourceNodeインスタンスを生成
        source = context.createBufferSource();

        // 再生・停止のプレフィックス
        source.start = source.start || source.noteOn;
        source.stop = source.stop || source.noteOff;

        // AudioBufferインスタンスを格納
        source.buffer = audioBuffer;

        // パラメータを設定
        source.loop = false;
        source.loopStart = 0;
        source.loopEnd = audioBuffer.duration;
        source.playbackRate.value = 1.0;

        // AudioBufferSourceNode (Input) -> AudioDestinationNode (Output)
        source.connect(context.destination);

        // 再生
        source.start(0);

        // コールバック関数の設定
        source.onended = function(event) {
          source.onended = null;
          document.onkeydown = null;
          // 停止
          source.stop(0);
          console.log('STOP by "on' + event.type + '"event handler !!');
        };

        document.onkeydown = function(event) {
          // space ?
          if (event.keyCode !== 32) {
            return;
          }

          // execute onended event handler
          trigger();

          return false;
        };

        // var prototypes = {};
 
        // prototypes.AudioBufferSourceNode = Object.getPrototypeOf(source);                            // AudioBufferSourceNode instance -> AudioBufferSourceNode
        // prototypes.AudioSourceNode = Object.getPrototypeOf(prototypes.AudioBufferSourceNode);  // AudioBufferSourceNode -> AudioSourceNode
        // prototypes.AudioNode = Object.getPrototypeOf(prototypes.AudioSourceNode);        // AudioSourceNode -> AudioNode

        // displayProperties(audioBuffer, 'audiobuffer-properties', 'AudioBuffer');
        // displayProperties(source, 'audiobuffersourcenode-properties', 'AudioBufferSourceNode');
        // // displayProperties(prototypes.AudioNode, 'audionode-properties', 'AudioNode');
      };

      // 処理が失敗した場合のエラー処理をするコールバック関数を指定する
      let errorCallback = function(error) {
        if (error instanceof Error) {
          window.alert(error.message);
        } else {
          window.alert('Error : "decodeAudioData" method.');
        }
      };
      // AudioBufferインスタンスの生成
      context.decodeAudioData(arrayBuffer, successCallback, errorCallback);
    };

    // Fileupload
    document.getElementById('file-upload-audio').addEventListener('change', function(event) {
      let uploader = this;
      let progressArea = document.getElementById('progress-file-upload-audio');

      // Get the instance of File (extends Blob)
      let file = event.target.files[0];

      if (!(file instanceof File)) {
        window.alert('Please upload file.');
      } else if (file.type.indexOf('audio') === -1) {
        window.alert('Please upload audio file.');
      } else {
        // Create the instance of FileReader
        let reader = new FileReader();

        reader.onprogress = function(event) {
          if (event.lengthComputable && (event.total > 0)) {
            let rate = Math.floor((event.loaded / event.total) * 100);
            progressArea.textContent = rate + ' %';
          }
        };

        reader.onerror = function() {
          window.alert('FileReader Error : Error code is ' + reader.error.code);
          uploader.value = '';
        };

        // Success read
        reader.onload = function() {
          let arrayBuffer = reader.result;  // Get ArrayBuffer

          startAudio(arrayBuffer);

          uploader.value = '';
          progressArea.textContent = file.name;
        };

        // Read the instance of File
        reader.readAsArrayBuffer(file);
      };
    }, false);
  };

  if ((document.readyStyle === 'interactive') || (document.readyState === 'complete')) {
    onDOMContentLoaded();
  } else {
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded, true);
  };
})();