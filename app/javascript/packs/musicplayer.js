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
let albumWork = [];
let animationId;
// let canvasContext;

// AudioContextの作成
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let context = new AudioContext();
context.createGain = context.createGain || context.createGainNode;
let analyser = context.createAnalyser();

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
let clearPlayer = function(canvasContext) {
  dispTime = 0;
  displayTime(0);
  document.getElementById("seek-bar").value = 0;
  document.getElementById("seek-bar").max = 1;
  document.getElementById("current-time").innerHTML = "00:00:00";
  document.getElementById("music-time").innerHTML = "00:00:00";
  playing = false;
  pausing = false;

  let canvas = document.getElementById("visualiser");
  let CanvasContext = canvas.getContext('2d');
  CanvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

let sound = function(buffer) {
  if (volumeControl == null) {
    volumeControl = context.createGain();
  };
  let source = context.createBufferSource();

  // コンテキストとビジュアライザーを接続
  analyser.connect(context.destination);

  // ビジュアライザーとボリュームコントロールを接続
  volumeControl.connect(analyser);

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

  // ボリュームコントロールと出力点を接続
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
            play(listNum);
          };
        };
      };
    });
  };
};

// flacファイルのメタデータの取得
// 変換
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
// データの配列から4バイトIntegerを取り出す
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

// メタデータの取得
// METADATA_BLOCK
function get_metadata_flac(data, k) {
  // flacファイルの場合
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
      return;
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
        document.getElementById("album-work").src = "/assets/no-image-9406927235933d1db5dc5141cb0bf262374ff1a2744e6bac8ccdc72ff0362ea2.jpg"

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

let ID3Reader = function(){

	let HEADER_FRAME_SIZE = 10;

	let ID3Header = {
		VER: ""
  };
  
	let ID3Frames = {
    TIT2: "", TPE1: "", TALB: "", TPE2: "", TCON: "", APIC: {
      mimeType: "", binary: null
		}
	};

	let ID3FrameID = {
    ID3: null, TIT2: null, TPE1: null, TALB: null, TPE2: null, TCON: null, APIC: null
  };
  
	(function(){
		for (let IDName in ID3FrameID) {
			let val = [];
			let len = IDName.length;
			for (let i = 0; i < len; i++) {
				val[i] = IDName.charCodeAt(i);
			}
			ID3FrameID[IDName] = val;
		}
	})();

	// iD3v2かどうかを判定
	let isID3v2 = function(data){
		if (data[0] === ID3FrameID["ID3"][0] && data[1] === ID3FrameID["ID3"][1] && data[2] === ID3FrameID["ID3"][2]) {
			return true;
		}
		return false;
	};

	// ID3のヘッダーを判定
	let readID3Header = function(data){
		if (data[3] === 0x02 && data[4] === 0x00) {
			ID3Header.VER = "v2.2";
		}else if (data[3] === 0x03 && data[4] === 0x00) {
			ID3Header.VER = "v2.3";
		}else if (data[3] === 0x04 && data[4] === 0x00) {
			ID3Header.VER = "v2.4";
		}
	};

	// // ID3のヘッダーのバージョンが2.2の判定
	// let isID3v22 = function(){
	// 	if (ID3Header.VER === "v2.2") {
	// 		return true;
	// 	}
	// 	return false;
	// };

	// ID3のフレームデータのサイズを計算
	let readID3PartBodySize = function(data){
		let size = (data[6] * Math.pow(128,3)) + (data[7] * Math.pow(128,2)) + (data[8] * Math.pow(128,1)) + (data[9] * Math.pow(128,0));
		return size;
  };

  // フレームIDの判定
	let isTIT2 = function(data, i){
		return isID(data, i, "TIT2");
	};
	let isTPE1 = function(data, i){
		return isID(data, i, "TPE1");
  };
  let isTALB = function(data, i){
		return isID(data, i, "TALB");
  };
  let isTPE2 = function(data, i){
		return isID(data, i, "TPE2");
  };
  let isTCON = function(data, i){
		return isID(data, i, "TCON");
	};
	let isAPIC = function(data, i){
		return isID(data, i, "APIC");
	};

  // フレームIDの取得
	let isID = function(data, i, IDName){
		if (data[i] === ID3FrameID[IDName][0] && data[i+1] === ID3FrameID[IDName][1] && data[i+2] === ID3FrameID[IDName][2] && data[i+3] === ID3FrameID[IDName][3]) {
			return true;
		}
		return false;
	};

	// フレームデータの文字数の取得
	let readFrameBodySize = function(data, i){
		return (data[i+4] << 24) | (data[i+5] << 16) | (data[i+6] << 8) | data[i+7];
	};

	// 文字エンコードの設定
	let getStringLatin1 = function(data, beginIndex, size){
		let latin1Uint8Array = data.subarray(beginIndex, beginIndex + size);
		return String.fromCharCode.apply(null, latin1Uint8Array);
	};
	let getStringUTF16 = function(data, beginIndex, size){
		// LE
		if (data[beginIndex] === 0xff && data[beginIndex + 1] === 0xfe) {
			return getStringUTF16LE(data, beginIndex + 2, size);
		// BE
		}else if (data[beginIndex] === 0xfe && data[beginIndex + 1] === 0xff) {
			return getStringUTF16BE(data, beginIndex + 2, size);
		}
	};
	let getStringUTF16LE = function(data, beginIndex, size){
		return getStringUTF16Common(data, beginIndex, size, "LE");
	};
	let getStringUTF16BE = function(data, beginIndex, size){
		return getStringUTF16Common(data, beginIndex, size, "BE");
	};
	let getStringUTF16Common = function(data, beginIndex, size, mode){
		let array16BE = [];
		let lastIndex = size + beginIndex;
		let offset1 = 0;
		let offset2 = 1;
		if (mode === "LE") {
			offset1 = 1;
			offset2 = 0;
		}
		for (let i = beginIndex; i < lastIndex; i += 2) {
			array16BE.push( (data[i + offset1] << 8) | data[i + offset2] );
		}
		// SurrogatePair OK
		return String.fromCharCode.apply(null, array16BE);
	};
	let getStringUTF8 = function(data, beginIndex, size){
		let array16BE = [];
		let lastIndex = size + beginIndex;
		let codepoint = 0x00;
		let highSurrogate = 0x00;
		let lowSurrogate = 0x00;
		let tmp = 0x00;
		for (let i = beginIndex; i < lastIndex; ) {
			// 1byte
			if (data[i] < 0x80) {
				codepoint = data[i];
				array16BE.push(codepoint);
				i++;
			// 2byte
			}else if (data[i] >= 0xc2 && data[i] < 0xe0) {
				codepoint = ((data[i] & 0x1f) << 6) | (data[i + 1] & 0x3f);
				array16BE.push(codepoint);
				i += 2;
			// 3byte
			}else if (data[i] >= 0xe0 && data[i] < 0xf0) {
				codepoint = ((data[i] & 0x0f) << 12) | ((data[i + 1] & 0x3f) << 6) | (data[i + 2] & 0x3f);
				array16BE.push(codepoint);
				i += 3;
			// 4byte
			}else if (data[i] >= 0xf0 && data[i] < 0xf5) {
				codepoint = ((data[i] & 0x07) << 18) | ((data[i + 1] & 0x3f) << 12) | ((data[i + 2] & 0x3f) << 6) | (data[i + 3] & 0x3f);
				tmp = codepoint - 0x10000;
				highSurrogate = (tmp >> 10) | 0xd800;
				lowSurrogate = (tmp & 0x3ff) | 0xdc00;
				array16BE.push(highSurrogate);
				array16BE.push(lowSurrogate);
				i += 4;
			}
		}
		return String.fromCharCode.apply(null, array16BE);
	};

  // フレームIDのテキストデータを取得
	let readText = function(data, i, IDName){
		let size = readFrameBodySize(data, i);
		let encodeIndex = i + HEADER_FRAME_SIZE;
		let text = "";

    // テキストデータの文字コード変換
		// ISO-8859-1(Latin-1)
		if (data[encodeIndex] === 0x00) {
			text = getStringLatin1(data, encodeIndex + 1, size - 1);
		// UTF-16 with BOM
		}else if (data[encodeIndex] === 0x01) {
			text = getStringUTF16(data, encodeIndex + 1, size - 3);
		// UTF-16BE without BOM
		}else if (data[encodeIndex] === 0x02) {
			text = getStringUTF16BE(data, encodeIndex + 1, size - 1);
		// UTF-8 (v2.4)
		}else if (data[encodeIndex] === 0x03) {
			text = getStringUTF8(data, encodeIndex + 1, size - 1);
		}

		ID3Frames[IDName] = text;
		return HEADER_FRAME_SIZE + size;
	};

	let isFrameHeaderFmtFlgIncludeOrgSize = function(data, beginIndex){
		return ((data[beginIndex + 9] & 0x01) === 0x01);
	};

	let readFrameBodySizeV24ForAPIC = function(data, i){
		return (data[i+4] * Math.pow(128,3)) + (data[i+5] * Math.pow(128,2)) + (data[i+6] * Math.pow(128,1)) + (data[i+7] * Math.pow(128,0));
	};

	let readMimeType = function(data, beginIndex){
		let endIndex = beginIndex;
		while (true) {
			if (data[endIndex] === 0x00) {
				break;
			}
			endIndex++;
		}
		let mimeTypeUint8Array = data.subarray(beginIndex, endIndex);
		return String.fromCharCode.apply(null, mimeTypeUint8Array);
	};

	let getImageInUint8Array = function(data, beginIndex, size){
		let imageUint8Array = data.subarray(beginIndex, beginIndex + size);
		return imageUint8Array;
  };

  // フレームIDのテキストデータの読み込み
	let readTIT2 = function(data, i){
		return readText(data, i, "TIT2");
	};
	let readTPE1 = function(data, i){
		return readText(data, i, "TPE1");
  };
  let readTALB = function(data, i){
		return readText(data, i, "TALB");
  };
  let readTPE2 = function(data, i){
		return readText(data, i, "TPE2");
  };
  let readTCON = function(data, i){
		return readText(data, i, "TCON");
  };
	let readAPIC = function(data, i){
		let size = readFrameBodySize(data, i);
		let orgSizeByte = 0;
		if (ID3Header.VER === "v2.4") {
			if (isFrameHeaderFmtFlgIncludeOrgSize(data, i)) {
				orgSizeByte = 4;
				size = readFrameBodySizeV24ForAPIC(data, i);
				// v2.4対応がうまくいかず、ここで書くのを一旦終了
			}
		}
		ID3Frames.APIC.mimeType = readMimeType(data, i + HEADER_FRAME_SIZE + 1 + orgSizeByte);
		let len = ID3Frames.APIC.mimeType.length;
		let imageIndex = i + HEADER_FRAME_SIZE + (1 + orgSizeByte + len + 1 + 2);
		ID3Frames.APIC.binary = getImageInUint8Array(data, imageIndex, size - (1 + len + 1 + 2));
		return HEADER_FRAME_SIZE + size;
	};

	// ID3のフレームを読み込む
	let readID3Frames = function(data){
		let len = readID3PartBodySize(data);
		let skip = 0;
		for (let i = 0; i < len; ) {
      if(isTIT2(data, i)) {
				skip = readTIT2(data, i);
				i += skip;
			}else if (isTPE1(data, i)) {
				skip = readTPE1(data, i) - 1;
				i += skip;
			}else if (isTALB(data, i)) {
				skip = readTALB(data, i);
				i += skip;
			}else if (isTPE2(data, i)) {
				skip = readTPE2(data, i) - 1;
				i += skip;
			}else if (isTCON(data, i)) {
				skip = readTCON(data, i) - 1;
				i += skip;
			}else if (isAPIC(data, i)) {
				skip = readAPIC(data, i) - 1;
				i += skip;
			}else{
				i++;
			}
		}
	};

	return {
    // ID3Readerの返り値としてread, getTIT2, TPE1, TALB, TPE2, TCONを返し、
    // メソッドとして使えるように設定
		read: function(data){
			readID3Header(data);
			readID3Frames(data);
		}, getTIT2: function(){
			return ID3Frames.TIT2;
		}, getTPE1: function(){
			return ID3Frames.TPE1;
    }, getTALB: function(){
			return ID3Frames.TALB;
		}, getTPE2: function(){
			return ID3Frames.TPE2;
    }, getTCON: function(){
			return ID3Frames.TCON;
		}, getAPIC_mimeType: function(){
			return ID3Frames.APIC.mimeType;
		}, getAPIC_binary: function(){
			return ID3Frames.APIC.binary;
    }, getID3v2: function() {
      return isID3v2(data);
    }
	};
}();

// Base64
let Base64 = function(){

  let _ENCODE_TABLE =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
  ];

	let _GETA = "=";

	let _NUM_OF_BYTES = 3;

	let encodeMain = function(data, i, outStrArray){
		let iNum = (data[i] << 16) + (data[i+1] << 8) + (data[i+2]);

		outStrArray.push( _ENCODE_TABLE[(iNum >> 18)] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 12) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 6) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[iNum & 0x3f] );
  };
  
	let encodePlus1Geta = function(data, i, outStrArray){
		let iNum = (data[i] << 8) + data[i+1];

		outStrArray.push( _ENCODE_TABLE[(iNum >> 10)] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 4) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[(iNum << 2) & 0x3f] );
		outStrArray.push( _GETA );
  };
  
	let encodePlus2Geta = function(data, i, outStrArray){
		let iNum = data[i];

		outStrArray.push( _ENCODE_TABLE[(iNum >> 2)] );
		outStrArray.push( _ENCODE_TABLE[(iNum << 4) & 0x3f] );
		outStrArray.push( _GETA );
		outStrArray.push( _GETA );
	};

	return {
		encode: function(data){

			if (!data){
				return "";
			}

			let outStrArray = [];

			let len = data.length;
			let count = Math.floor(len / _NUM_OF_BYTES);
			let mod = len % _NUM_OF_BYTES;

			for (let i=0; i<count; i++) {
				encodeMain(data, _NUM_OF_BYTES * i, outStrArray);
			}

			switch (mod) {
				case 2:
					encodePlus1Geta(data, _NUM_OF_BYTES * count, outStrArray);
					break;
				case 1:
					encodePlus2Geta(data, _NUM_OF_BYTES * count, outStrArray);
					break;
			}

			return outStrArray.join("");
		}
	};
}();

// APIC（画像の）読み込み
function createImgElemInViewAPIC(src){
  let img = document.getElementById("album-work");
	img.src = src;
  img.title = "coverImage";
  img.height = 200; 
}

// ID3タグの読み込み
function get_metadata_mp3(value, k){
  let data = new Uint8Array(value);
  if(ID3Reader.getID3v2(data)) {
    ID3Reader.read(data);
  
    m = k + 1;
    document.getElementById("title" + String(m)).textContent = ID3Reader.getTIT2();
    document.getElementById("artists" + String(m)).textContent = ID3Reader.getTPE1();
    document.getElementById("album" + String(m)).textContent = ID3Reader.getTALB();
    document.getElementById("album-artists" + String(m)).textContent = ID3Reader.getTPE2();
    document.getElementById("genre" + String(m)).textContent = ID3Reader.getTCON();

    if (ID3Reader.getAPIC_mimeType() !== "") {
      let imgSrc = "data:" + ID3Reader.getAPIC_mimeType() + ";base64," + Base64.encode(ID3Reader.getAPIC_binary());
      albumWork[k] = imgSrc;
      createImgElemInViewAPIC(albumWork[0]);
    }
    document.getElementById("name_artists").innerHTML = document.getElementById("title1").textContent;
  }
}

// ビジュアライザーの設定
// 高速フーリエ変換の分割サイズ
analyser.fftSize = 128;

// ビジュアライザの描画
render = function(){

  // ビジュアライザの要素を取得
  let canvas = document.getElementById("visualiser");

  // canvas要素の描画コンテキストの作成
  let canvasContext = canvas.getContext('2d');

  // 符号なしのlong型でFFT（高速フーリエ変換）のサイズの半分の値を取得
  canvas.setAttribute('width', analyser.frequencyBinCount * 10);
  let spectrums = new Uint8Array(analyser.frequencyBinCount);

  // 周波数データを引数として渡されたUint8Array配列(unsigned byte配列)へコピー
  analyser.getByteFrequencyData(spectrums);

  // 四角形の形にクリアする 
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  for(let i=0, len=spectrums.length; i<len; i++){
    canvasContext.strokeStyle = "green";
    canvasContext.fillStyle = "green";
    // 塗りつぶしの四角形を描く
    canvasContext.fillRect(i*10, canvas.height, 5, -spectrums[i] * 0.5);
  }

  if(pausing || playing) {
    animationId = requestAnimationFrame(render);
  } else {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  }

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
      get_metadata_flac(data, k);
      get_metadata_mp3(value, k);
      let bgm = list[k];
      getAudioBuffer(bgm, function(buffer) {
        document.getElementById('length' + String(k+1)).innerHTML = parseTime(buffer.duration);
      });
    };
  }

  // リストのダブルクリックで音楽の再生（最初のページ読み込み時にtune-recordが存在しないため、ここで作成）
  let tuneRecord = document.getElementsByClassName("tune-record");
  for (let n = 0; n < tuneRecord.length; n++) {
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
        // ビジュアライザーの描画を開始
        animationId = requestAnimationFrame(render);
        playerStatus();
        document.getElementById("seek-bar").max = parseFloat(buffer.duration);
        document.getElementById("music-time").innerHTML = parseTime(buffer.duration);
      });
    });

    document.getElementById("name_artists").innerHTML = document.getElementById("title"+String(listNum+1)).textContent;

    if(albumWork[listNum]) {
      createImgElemInViewAPIC(albumWork[listNum])
    } else {
      document.getElementById("album-work").src = "/assets/no-image-9406927235933d1db5dc5141cb0bf262374ff1a2744e6bac8ccdc72ff0362ea2.jpg"
    }
    
    if(listNum !== 0) {
      document.getElementById(String(listNum)).classList.remove("active")
    }
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
