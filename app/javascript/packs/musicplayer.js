// 変数の指定
let soundFile = null;
let pauseTime = 0;
let audioTime = 0;
let startTime = 0;
let dispTime = 0;
let playing = false;
let pausing = false;
let stopping = true;
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
  stopping = true;
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
  pausing = false;
  stopping = false;

  // 再生が終了した際の処理
  source.onended = function() {
    // contextの時間経過を停止
    context.suspend().then(function() {
      dispTime = document.getElementById("seek-bar").value;
      playerStatus();
      if(!pausing) {
        clearPlayer();
        if(!stopping) {
          if(listNum < list.length - 1) {
            listNum++;
            play();
          };
        };        
      };
    });
  };
};

// ファイルの読み込み
let input = function() {
  clearPlayer();
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
  if (soundFile != null) {
    playing = false;
    pausing = false;
    stopping = true;
    soundFile.stop(0);
    clearPlayer();
  }
}

// 次の楽曲へ
let stepForward = function() {
  if(listNum < list.length - 1) {
    stop();
    clearPlayer();
    listNum++;    
    play();
  };
}

// 前の楽曲へ
let stepBackward = function() {
  if(listNum > 0) {
    stop();
    clearPlayer();
    listNum--;
    play();
  };
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
  // 次の楽曲へ
  document.getElementById("step-forward").addEventListener('click', function(){
    stepForward();
  });
  // 次の楽曲へ
  document.getElementById("step-backward").addEventListener('click', function(){
    stepBackward();
  });
}, false);
