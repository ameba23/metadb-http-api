## metadb

### Status: WIP - highly experimental

metadb is a peer-to-peer media file metadata database. Peers can extract information about their media files and replicate this data with other peers, to create a searchable distributed database of all known files.

There is also a system of sending encrypted requests for particular files, and responding to requests with a way of transferring them.

metadb aims to be transport agnostic - the focus of the project is on providing a metadata index - actual transfer of the files could be done by whichever protocol you choose, for example IPFS, DAT, or Bittorrent. This implementation contains a way to serve files by streaming them as tar archives, but any information can be included in a response to a request for a file, making it easy to plug in different transport mechanisms.

It also aims to be extendible - arbitrary data can be published about files, which might include comments, reviews, 'stars', or links to web resources, or integration with local media libraries such as calibre or music player daemon.

It has an HTTP API and a simple web interface, meaning it can also be run on an ARM device, NAS, or remote server.

![screenshot metadb ui](http://ameba.ehion.com/download/metadb-screenshot1.png)

![screenshot metadb ui](http://ameba.ehion.com/download/metadb-screenshot2.png)

### Features

- Built on [kappa-core](https://github.com/kappa-db/kappa-core)
- Uses [kappa-private](https://ledger-git.dyne.org/CoBox/kappa-private) for encrypted messages between peers
- Replicate with the database of others to produce a collective database of file metadata - using the `hyperswarm` DHT for peer discovery.
- Private and public groups supported.
- Pluggable metadata extractors. Included are:
  - [Exiftool](https://www.sno.phy.queensu.ca/~phil/exiftool/) - built for images but extracts data from a wide variety of other types of files.  Requires the script to be installed externally.  `exif-keys.json` specifies a list of attributes from exiftool that we would like to index.
  - [music-metadata](https://github.com/borewit/music-metadata)
  - `pdf-text` which extracts text from PDFs using [pdf2json](https://github.com/modesty/pdf2json)
  - [image-size](https://github.com/image-size/image-size)

This module is an http API exposing the functionality from [metadb-core](https://github.com/ameba23/metadb-core), and the web based front end, [metadb-ui](https://github.com/ameba23/metadb-ui)

### Installation and usage

- Install globally with npm or yarn, eg: `npm i -g metadb`
- Run `metadb start`
- You should see a link to the web interface served on localhost
- To get started, you probably want to index some media files, by clicking 'shares' in the web interface, or typing `metadb index <directory>` in another terminal window.
- To connect to other users and merge databases, you need to connect to a swarm, on the 'connection' page.
Here you can type a name which will be hashed to give a topic on the DHT to find other peers.  There are currently no known public swarms.
- You can request files of other peers. Active transfers are not yet displayed in the interface very well, you should be able to see some output in the terminal window running to API.

metadb is based on an older unfinished python project, [meta-database](https://github.com/ameba23/meta-database). 

![AGPL3](https://www.gnu.org/graphics/agplv3-with-text-162x68.png)
