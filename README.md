# 制作背景
- 音楽が聴くのが好きで、それに関するWebアプリケーションを作りたかった。好きなことに結び付けていれば、必要な機能の実装やモチベーションの維持に役立つと思った。

# 工夫した点
- ミュージックプレイヤーアプリとして最低限の機能を持たせることは最低ラインとした。
- 技術を習得するための姿勢、学習方法に慣れるために、技術本では得られない新しい技術を取り入れることになった。そのため、DocumentやReferenceを意識的に読んだ。
- 実装したい機能の一つであるビジュアライザのために、楽曲の再生はWeb Audio APIを使用した。
- metadata（音楽ファイルに組み込まれている楽曲情報）の取得のために、バイナリデータを扱った。

# アプリケーション説明
## ユーザー機能
- Nickname, Email, Passwordを登録して、ユーザー管理を行います。

![signin](/README-figures/signin.png)

- サインイン時、これらのいずれかが入力していない、もしくは間違っている場合、再度ログイン画面へ戻されます。
- サインアップ時（新規登録時）には、バリデーションが組まれており、これに引っ掛かるとエラーメッセージが表示されます。また、Nickname, Emailがすでに使用されている場合も、バリデーションによってはじかれます。

![signup(error1)](/README-figures/signup(error1).png)
![signup(error2)](/README-figures/signup(error2).png)

## トップページ（ミュージックプレイヤー）

![toppage(musicplayer)](/README-figures/toppage(musicplayer).png)

### 機能
- 楽曲の再生・停止・一時停止・再開、次の楽曲を再生、前の楽曲を再生、音量の増加・減少、再生時間・演奏時間の表示
- flacファイルの場合のみ、楽曲タイトル、アーティスト名、アルバム名、アルバムアーティスト名、ジャンルの表示ができます。
- ファイルを再生するには、FileAPIを使ってアップロードをすることで再生します。ただし、音楽ファイルは保存はされません。複数選択は可能です。

![demo1](/README-figures/upload-tune(get-metadata-in-flac).gif)
![demo2](/README-figures/play-tune(component).gif)
![demo3](/README-figures/play-tune(dblclick).gif)


## 今後の予定（実装したい機能）
- 参照フォルダをDBに保存し、サインインすると同時に、その参照フォルダ内の楽曲をリスト表示
- 楽曲の検索（全ての楽曲、アーティスト名、ジャンル等）
- プレイリストの作成・エクスポート・インポート
- 楽曲・プレイリストのデバイス（スマートフォン）への転送
- ビジュアライザの実装
- アルバムワークの表示
- APIを用いた楽曲の情報取得
- オプション機能（スキンの変更）
- デプロイ
- 他オーディオファイル（mp3）のメタデータを取得し、表示


# DB設計

ER図
![ER図](/db/ER--figure.jpg)

## usersテーブル
|Column|Type|Options|
|------|----|-------|
|nickname|string|null: false, unique: true|
|email|string|null: false, unique: true|
|password|string|null: false, unique: true|

### Association
- has_many :tunes
- has_many :playlists

## tunesテーブル
|Column|Type|Options|
|------|----|-------|
|albumart|text||
|title|string|null: false|
|artist|string|unique: true|
|albumartist|string|unique: true|
|length|integer|null: false|
|genre|string|unique: true|
|fileaddress|text|null: false, unique: true|
|user_id|references|null: false, foreign_key: true|

### Association
- belong_to :user
- has_many :tunes_playlists
- has_many :playlists, through: tunes_playlists

## playlistsテーブル
|Column|Type|Options|
|------|----|-------|
|name|string|null: false|
|user_id|references|null: false, foreign_key: true|

### Association
- belong_to :user
- has_many :tunes_playlists
- has_many :tunes, through: tunes_playlists

## tunes_playlistsテーブル
|Column|Type|Options|
|------|----|-------|
|name|string|null: false|
|tunes_id|references|null: false, foreign_key: true|
|playlists_id|references|null: false, foreign_key: true|

### Association
- belong_to :tune
- belong_to :playlist
