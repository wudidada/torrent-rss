const express = require('express')
const fs = require('fs');
const app = express()

const KEY = 'wudidada';
const TORRENT_FILE = 'torrent.json'

let torrents = readJson(TORRENT_FILE);

var bodyParser = require('body-parser')
app.use(bodyParser.json());

app.get('/torrent.xml', (req, res) => {
    if (isValid(req)) {
        res.header('Content-Type', 'application/xml')
        res.status(200).send(xmlFeed());
    } else {
        res.send('');
    }
})

app.post('/add', (req, res) => {
    if (isValid(req)) {
        addTorrent(req.body) && res.sendStatus(200) || res.sendStatus(500);
    } else {
        res.sendStatus(404);
    }
})

app.get('/list', (req, res) => {
    if (isValid(req)) {
        const listHtml = createHtml();
        res.send(listHtml);
    } else {
        res.sendStatus(404);
    }
})

app.get('/clear', (req, res) => {
    if (isValid(req)) {
        torrents.splice(0);
        writeJson(TORRENT_FILE, torrents);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

const port = 8081;
var server = app.listen(port, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})

xmlItem = (torrent) => `            <item>
			<title><![CDATA[${torrent.title}]]></title>
			<enclosure url="${escapeXml(torrent.link)}" length="1466086387" type="application/x-bittorrent" />
			<guid isPermaLink="false">${escapeXml(torrent.link)}</guid>
		</item>\n`

function xmlFeed() {
    const items = torrents.reduce((xml, torrent) => (xml + xmlItem(torrent)), '');
    return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
	<channel>
		<title>Jusbin Torrents</title>
		<link><![CDATA[https://springsunday.net]]></link>
		<description><![CDATA[Latest torrents]]></description>
		<language>zh-cn</language>
		<copyright>Copyright (c) SSD 2010-2022, all rights reserved</copyright>
		<docs><![CDATA[http://www.rssboard.org/rss-specification]]></docs>
		<ttl>60</ttl>
		<image>
			<url><![CDATA[https://springsunday.net/pic/rss_logo.jpg]]></url>
			<title>SSD Torrents</title>
			<link><![CDATA[https://springsunday.net]]></link>
			<width>100</width>
			<height>100</height>
			<description>SSD Torrents</description>
		</image>
${items}		
	</channel>
</rss>`
}

function isValid(req) {
    return req?.query?.key == KEY;
}

function addTorrent(data) {
    console.log('torrent', data);
    const title = data?.title;
    const link = data?.link;

    if (!title || !link)
        return false;

    if (!torrents.some(e => e.link === link)) {
        torrents.splice(0, 0, { title, link })
        writeJson(TORRENT_FILE, torrents);
    }

    return true;
}


const row = html => `<tr>\n${html}</tr>\n`,
    heading = object => row(Object.keys(object).reduce((html, heading) => (html + `<th>${heading}</th>`), '')),
    datarow = object => row(Object.values(object).reduce((html, value) => (html + `<td>${value}</td>`), ''));


function createHtml() {
    if (torrents.length == 0) {
        return `empty torrents`;
    }

    return `<table>
            ${heading(torrents[0])}
            ${torrents.reduce((html, object) => (html + datarow(object)), '')}
          </table>`
}


function readJson(filename) {
    if (!fs.existsSync(filename)) {
        return []
    }

    let rawdata = fs.readFileSync(filename);
    return JSON.parse(rawdata);
}

function writeJson(filename, data) {
    fs.writeFile(filename, JSON.stringify(data, null, 4), (err) => {
        if (err)
            console.log(err);
        else {
            console.log("File written successfully");
        }
    });
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}