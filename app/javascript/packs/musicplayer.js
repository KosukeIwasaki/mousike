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
let tuneTitleList = [];

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
  source.stop = source.stop || source.noteOff;

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

// flacファイルのメタデータの取得
// データの配列から1バイトIntegerを取り出す
function data_int1(data) {
  return data[i_data++];
}

// データの配列から2バイトIntegerを取り出す
function data_int2(data) {
  let val = (data[i_data] << 8) | data[i_data + 1];
  i_data += 2
  return val;
}

// データの配列から3バイトIntegerを取り出す
function data_int3(data) {
  let val = (data[i_data] << 16) | (data[i_data + 1] << 8) | data[i_data + 2];
  i_data += 3
  return val;
}

// データの配列から4バイトInteger を取り出す
// 結果のMSBが1の場合，Integerの値としては負になる
function data_int4(data) {
  let val = (data[i_data] << 24) | (data[i_data + 1] << 16) | (data[i_data + 2] << 8) | data[i_data + 3];
  i_data += 4
  return val;
}

// データの配列からlittle endianの4バイトIntegerを取り出す
// 結果のMSBが1の場合、Integerの値としては負になる
function data_int4_le(data) {
  let val = data[i_data] | (data[i_data + 1] << 8) | (data[i_data + 2] << 16) | (data[i_data + 3] << 24);
  i_data += 4;
  return val;
}

// UTF-8 → UTF-16変換
function utf8to16(utf8) {
  let utf16 = "";
  for(let i = 0; i < utf8.length; ) {
    let c = utf8.charCodeAt(i);
    if((c & 0xe0) == 0xc0) {
      utf16 += String.fromCharCode(((c & 0x1f) << 6) | utf8.charCodeAt(i + 1) & 0x3f);
      i += 2;
    }
    else if((c & 0xf0) == 0xe0) {
      utf16 += String.fromCharCode(((c & 0x0f) << 12) | ((utf8.charCodeAt(i + 1) & 0x3f) << 6)| utf8.charCodeAt(i + 2) & 0x3f);
      i += 3;
    }
    else {
      utf16 += utf8[i++];
    }
  }
  return utf16;
}

// METADATA_BLOCK
// メタデータの取得
function get_metadata(data, k) {
  if(data.length < 4) {
    return 0;
  }
  i_data = 0;
  if(data_int4(data) != 0x664c6143) { // fLaCかどうかを判定
    return;
  }
  for(; ; ) {
    let i;

    // METADATA_BLOCK_HEADER
    if(i_data + 4 > data.length){
      return false;
    }
    
    let flg_typ = data_int1(data);
    let len = data_int3(data);
    if(i_data + len > data.length) {
      return -1;
    }
    
    // METADATA_BLOCK_DATA
    switch(flg_typ & 0x7f) {  // BLOCK_TYPE
      case 4:  // VORBIS_COMMENT
      // 曲タイトル，アーティスト名を取得
      let i_skip = i_data + len;
      if(len < 4) {
        return false;
      }
      if((len = data_int4_le(data)) & 0x80000000) { // vendor_length
        return false;
      }
      if(i_data + len > data.length) {
          return false;
        }
        i_data += len;  // vendor_string
        if(i_data + 4 > data.length) {
          return false;
        }
        let n_comments = data_int4_le(data);  // user_comment_list_length
        if(n_comments & 0x80000000) {
          return false;
        }
        let f = 0x3;
        for(i = 0; i < n_comments; i++) {
          if(i_data + 4 > data.length) {
            return false;
          }
          if((len = data_int4_le(data)) & 0x80000000) {  // length
            return false;
          }
          if(i_data + len > data.length) {
            return false;
          }
          let comment = "";
          for(; len; len--) {
            comment += String.fromCharCode(data[i_data++]);
          }

          m = k + 1;
          if(comment.substr(0, 6).toUpperCase() == "TITLE=") {
            document.getElementById("title" + String(m)).textContent = utf8to16(comment.substr(6));
            f &= ~0x1;
            tuneTitleList.push(utf8to16(comment.substr(6)));
          }
          if(comment.substr(0, 7).toUpperCase() == "ARTIST=") {
            document.getElementById("artists" + String(m)).textContent = utf8to16(comment.substr(7));
            f &= ~0x2;
          }
          if(comment.substr(0, 6).toUpperCase() == "ALBUM=") {
            document.getElementById("album" + String(m)).textContent = utf8to16(comment.substr(6));
            f &= ~0x1;
          }
          if(comment.substr(0, 12).toUpperCase() == "ALBUMARTIST=") {
            document.getElementById("album-artists" + String(m)).textContent = utf8to16(comment.substr(12));
            f &= ~0x3;
          }
          if(comment.substr(0, 7).toUpperCase() == "LENGTH=") {
            document.getElementById("length" + String(m)).textContent = utf8to16(comment.substr(7));
            f &= ~0x4;
          }
          if(comment.substr(0, 6).toUpperCase() == "GENRE=") {
            document.getElementById("genre" + String(m)).textContent = utf8to16(comment.substr(6));
            f &= ~0x5;
          }
        }
        document.getElementById("name_artists").innerHTML = document.getElementById("title1").textContent;
        i_data = i_skip;
        break;

      // 画像（アートワーク）の取得
      case 6:

      case 127:
        return -1;
      default:
        i_data += len;
    }
    if(flg_typ & 0x80) { // last metadata block
      break;
    }
  }
  return 0;
}

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

  // 取得したファイルをテーブルに表示する
  let fileReader = [];
  for(let j = 0; j < document.getElementById("file-upload-audio").files.length; j++) {
    fileReader[j] = "fileReader" + String(j);
  }
  document.getElementById('music-lists-tunes').textContent = null;
  
  for(let k = 0; k < document.getElementById("file-upload-audio").files.length; k++) {
    let musicTable = document.getElementById('music-lists-tunes');
    let row = musicTable.insertRow(-1);
    row.id = k+1;
    document.getElementById(k+1).classList.add("tune-record");
    let IDCell = row.insertCell(-1);
    IDCell.id = 'ID' + String(k+1);
    IDCell.textContent = k + 1;
    let titleCell = row.insertCell(-1);
    titleCell.id = 'title' + String(k+1);
    let artistsCell = row.insertCell(-1);
    artistsCell.id = 'artists' + String(k+1);
    let albumCell = row.insertCell(-1);
    albumCell.id = 'album' + String(k+1);
    let albumArtistsCell = row.insertCell(-1);
    albumArtistsCell.id = 'album-artists' + String(k+1);
    let lengthCell = row.insertCell(-1);
    lengthCell.id = 'length' + String(k+1);
    let genreCell = row.insertCell(-1);
    genreCell.id = 'genre' + String(k+1);

    fileReader[k] = new FileReader();
    let file = document.getElementById("file-upload-audio").files[k];
    fileReader[k].readAsArrayBuffer(file);
    fileReader[k].onload = function() {
      let value = fileReader[k].result;
      data = new Uint8Array(value);
      get_metadata(data, k);
      let bgm = list[k];
      getAudioBuffer(bgm, function(buffer) {
        document.getElementById('length' + String(k+1)).innerHTML = parseTime(buffer.duration);
      });
    };
  }

  // リストのダブルクリックで音楽の再生（最初のページ読み込み時にtune-recordが存在しないため、ここで作成）
  let tuneRecord = document.getElementsByClassName("tune-record");
  for (var n = 0; n < tuneRecord.length; n++) {
    tuneRecord[n].addEventListener("dblclick", function() {
      stop(listNum);
      listNum = this.id - 1;
      play(this.id-1);
    }, false);
  }

};

// プレイヤーの処理
// 再生
let play = function(listNum) {
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

    document.getElementById("name_artists").innerHTML = document.getElementById("title"+String(listNum+1)).textContent;
    document.getElementById(String(listNum+1)).classList.add("active")
  };
};

// 一時停止
let pause = function() {
  pauseTime = context.currentTime - startTime;
  pausing = true;
  soundFile.stop(0);
};

// 停止
let stop = function(listNum) {
  if (soundFile != null) {
    playing = false
    pausing = false;
    stopping = true;
    soundFile.stop(0);
    clearPlayer();

    document.getElementById(String(listNum+1)).classList.remove("active")
  }
};

// 次の楽曲へ
let stepForward = function() {
  if(listNum < list.length - 1) {
    stop(listNum);
    clearPlayer();
    listNum++;    
    play(listNum);
  };
};

// 前の楽曲へ
let stepBackward = function() {
  if(listNum > 0) {
    stop(listNum);
    clearPlayer();
    listNum--;
    play(listNum);
  };
};

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
    play(listNum);
  });
  // 音楽の停止
  document.getElementById("stop").addEventListener('click', function(){
    stop(listNum);
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
