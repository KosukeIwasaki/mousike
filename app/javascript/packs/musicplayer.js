// 変数の指定
let soundFile = null;
let pauseTime = 0;
let audioTime = 0;
let startTime = 0;
let dispTime = 0;
let playing = false;
let pausing = false;
let repeatFlag = false;
let listNum = 0;
let volumeControl = null;

// AudioContextの作成
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let context = new AudioContext();
context.createGain = context.createGain || context.createGainNode;

// Bufferへのデコード
let getAudioBuffer = function(url, fn) {
  let request = new XMLHttpRequest();
  request.responseType = 'arraybuffer';
  request.onreadystatechange = function() {
    // XMLHttpRequestの処置が完了しているか
    if (request.readyState === 4) {
      //レスポンスのステータスを確認
      // 200はリクエストに成功
      if (request.status === 0 || request.status === 200) {
        context.decodeAudioData(request.response, function(buffer) {
          fn(buffer);
        });
      };
    };
  };
  request.open('GET', url, true);
  request.send('');
};

// 音量の変更
let changeVolume = function() {
  if (volumeControl != null) {
    volumeControl.gain.value = document.getElementById("volume-range").value;
  }
}

// 表示する時間を作成
let parseTime = function(time) {
  let returnTime;
  let second = ("0" + Math.floor(time % 60)).slice(-2);
  let minutes = ("0" + Math.floor((time / 60) % 60)).slice(-2);
  let hour = ("0" + Math.floor((time / 60) / 60)).slice(-2);
  returnTime = hour + ":" + minutes + ":" + second;
  return returnTime;
}

// 時間の表示設定
let displayTime = function(audio) {
  // 再生中か一時停止中でないなら
  if(playing && !pausing) {
    document.getElementById("seek-bar").value = dispTime + context.currentTime - audio;
    // 表示する時間＝一時停止中の時間＋再生ボタンを押してからの時間ー音楽が流れてからの時間
    document.getElementById("current-time").innerHTML = parseTime(document.getElementById("seek-bar").value);
    setTimeout(function() {displayTime(audio)}, 10);
  } else {
    clearTimeout(displayTime);
  }
}

// 再生中なら一時停止ボタンを、
// 一時停止中なら再生ボタンを表示
let playerStatus = function() {
  if(context.state === 'running') {
    document.getElementById("play").style.display = 'none';
    document.getElementById("pause").style.display = 'inline-block';
  } else {
    document.getElementById("play").style.display = 'inline';
    document.getElementById("pause").style.display = 'none';
  }
  displayTime(audioTime);
}

// プレイヤーの初期化
let clearPlayer = function() {
  dispTime = 0;
  displayTime(0);
  document.getElementById("seek-bar").value = 0;
  document.getElementById("seek-bar").max = 1;
  document.getElementById("current-time").innerHTML = "00:00:00";
  document.getElementById("music-time").innerHTML = "00:00:00";
  playing = false;
  pausing = false;
}

let sound = function(buffer) {
  if (volumeControl == null) {
    volumeControl = context.createGain();
  };
  let source = context.createBufferSource();
  volumeControl.connect(context.destination);
  source.buffer = buffer;

  if(!playing) {
    // 初めて音を再生する際、再生開始時のcontext.currentTimeが0とは限らないため取得
    startTime = context.currentTime;
    // 再生開始時間を取得
    audioTime = startTime;
    // 実再生開始時間を設定
    resumeTime = 0;
  } else {
    // 再生開始時間を取得
    audioTime = context.currentTime;
    // 実再生開始時間を設定
    resumeTime = pauseTime;
  };

  source.connect(volumeControl);
  // 外部の関数からはsoundFileで処理を行うことにする
  soundFile = source;

  // 音の再生
  source.start(0, resumeTime);
  playing = true;

  // 再生が終了した際の処理
  source.onended = function() {
    // contextの時間経過を停止
    context.suspend().then(function() {
      dispTime = document.getElementById("seek-bar").value;
      playerStatus();
      if(!pausing) {
        clearPlayer();
        if(listNum < list.length - 1) {
          listNum++;
          play();
        };
      };
    });
  };
};

// ファイルの読み込み
let input = function() {
  list = [];
  audioName = [];
  for(let i = 0; i < document.getElementById("file-upload-audio").files.length; i++) {
    if(document.getElementById("file-upload-audio").files[i].type.match(/audio\/.+/)) {
      list.push(window.URL.createObjectURL(document.getElementById("file-upload-audio").files[i]));
      audioName.push(document.getElementById("file-upload-audio").files[i].name.replace(/\.\w+$/, ""));
    };
  };
  document.getElementById("name_artists").innerHTML = audioName[listNum];
}


// プレイヤーの処理
// 再生
let play = function() {
  if(!playing || pausing) {
    let bgm = list[listNum];
    getAudioBuffer(bgm, function(buffer) {
      context.resume().then(function() {
        sound(buffer, false);
        pausing = false;
        playerStatus();
        document.getElementById("seek-bar").max = parseFloat(buffer.duration);
        document.getElementById("music-time").innerHTML = parseTime(buffer.duration);
      });
    });
    document.getElementById("name_artists").innerHTML = audioName[listNum];
  };
};

// 一時停止
let pause = function() {
  pauseTime = context.currentTime - startTime;
  pausing = true;
  soundFile.stop(0);
}

// 停止
let stop = function() {
  if (soundFile != null || pausing) {
    playing = false;
    soundFile.stop(0);
    if(pausing) {
      clearPlayer();
    }
  }
}

// // リピート
// let player_repeat = function() {
//   if(repeatFlag) {
//     repeatFlag = false;
//     repeatBtn.src = 'icon/リピート_false.png'
//   } else {
//     repeatFlag = true;
//     repeatBtn.src = 'icon/リピート_true.png'
//   }
// }


window.addEventListener("DOMContentLoaded", function() {

  document.getElementById("pause").style.display="none";

  // イベントリスナー
  // ファイルの読み込み
  document.getElementById("file-upload-audio").addEventListener('change', function(){
    input();
  });
  // 音楽の再生
  document.getElementById("play").addEventListener('click', function(){
    play();
  });
  // 音楽の停止
  document.getElementById("stop").addEventListener('click', function(){
    stop();
  });
  // 音楽の一時停止
  document.getElementById("pause").addEventListener('click', function(){
    pause();
  });
  // 音量の変更
  document.getElementById("volume-range").addEventListener('change', function(){
    changeVolume();
  });
}, false);

//   let onDOMContentLoaded = function() {

//     window.AudioContext = window.AudioContext || window.webkitAudioContext;

//     let context = new AudioContext();
//     let source = null;

//     let trigger = function() {
//       let event = document.createEvent('Event');
//       event.initEvent('ended', true, true);

//       if (source instanceof AudioBufferSourceNode) {
//           source.dispatchEvent(event);
//       }
//     };

//     let setAudio = function(arrayBuffer) {

//       let successCallback = function(audioBuffer) {
//       // audioBufferはAudioBufferのインスタンス
//         // 第１引数
//         // sourceに音源が格納されている場合は、sourceを空にする
//         if ((source instanceof AudioBufferSourceNode) && (source.buffer instanceof AudioBuffer)) {
//           trigger();
//           source = null;
//         };

//         // AudioBufferSourceNodeインスタンスを生成
//         source = context.createBufferSource();

//         // AudioBufferインスタンスを格納
//         source.buffer = audioBuffer;

//         // パラメータを設定
//         source.loop = false;
//         source.loopStart = 0;
//         source.loopEnd = audioBuffer.duration;
//         source.playbackRate.value = 1.0;

//         // AudioBufferSourceNode (Input) -> AudioDestinationNode (Output)
//         source.connect(context.destination);

//         // コールバック関数の設定
//         source.onended = function(event) {
//           source.onended = null;
//           document.onkeydown = null;
//           // 停止
//           source.stop(0);
//         };

//         // document.onkeydown = function(event) {
//         //   // space ?
//         //   if (event.keyCode !== 32) {
//         //     return;
//         //   }
//         //   // execute onended event handler
//         //   trigger();
//         //   return false;
//         // }

//       };

//       // 処理が失敗した場合のエラー処理をするコールバック関数を指定する
//       let errorCallback = function(error) {
//         if (error instanceof Error) {
//           window.alert(error.message);
//         } else {
//           window.alert('Error : "decodeAudioData" method.');
//         }
//       };

//       // AudioBufferインスタンスの生成
//       context.decodeAudioData(arrayBuffer, successCallback, errorCallback);
//     };

//     // Fileupload
//     document.getElementById('file-upload-audio').addEventListener('change', function(event) {
//       let uploader = this;
//       let progressArea = document.getElementById('progress-file-upload-audio');

//       // Get the instance of File (extends Blob)
//       let file = event.target.files[0];

//       if (!(file instanceof File)) {
//         window.alert('Please upload file.');
//       } else if (file.type.indexOf('audio') === -1) {
//         window.alert('Please upload audio file.');
//       } else {
//         // Create the instance of FileReader
//         let reader = new FileReader();

//         reader.onprogress = function(event) {
//           if (event.lengthComputable && (event.total > 0)) {
//             let rate = Math.floor((event.loaded / event.total) * 100);
//             progressArea.textContent = rate + ' %';
//           }
//         };

//         reader.onerror = function() {
//           window.alert('FileReader Error : Error code is ' + reader.error.code);
//           uploader.value = '';
//         };

//         // Success read
//         reader.onload = function() {
//           let arrayBuffer = reader.result;  // Get ArrayBuffer
          
//           setAudio(arrayBuffer);

//           uploader.value = '';
//           progressArea.textContent = file.name;
//         };

//         // Read the instance of File
//         reader.readAsArrayBuffer(file);
//       };
//     }, false);

//     // 音楽の再生
//     document.getElementById("play").addEventListener('click', function(){
//       // 再生のプレフィックス
//       source.start = source.start || source.noteOn;
//       // 再生
//       source.start(0);
//     });

//     // 音楽の停止
//     document.getElementById("stop").addEventListener('click', function(){
//       // 停止のプレフィックス
//       source.stop = source.stop || source.noteOff;
//       // 再生
//       source.stop(0);
//     });
    
//   };

//   if ((document.readyStyle === 'interactive') || (document.readyState === 'complete')) {
//     onDOMContentLoaded();
//   } else {
//     document.addEventListener('DOMContentLoaded', onDOMContentLoaded, true);
//   };

// })();