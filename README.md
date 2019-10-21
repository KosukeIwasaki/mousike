#DB設計

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
