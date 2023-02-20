// e-私書箱 downloader

// -*- coding: utf-8 -*-

// Copyright 2023 Satoshi KURAMOCHI <skuramochi@gmail.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function loadScripts() {
	let script = document.createElement("script");
	script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
	document.head.append(script);
	script = document.createElement("script");
	script.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
	document.head.append(script);
}

const headers = {
	'Accept': 'application/json',
	'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
};

async function loadKofuList(kofuHmsFrom, kofuHmsTo) {
	const payload = {
		_csrf: sessionStorage.getItem("dp-csrf"),
		riyoCd: sessionStorage.getItem("dp-riyoCd"),
		kofuHmsFrom: kofuHmsFrom,
		kofuHmsTo: kofuHmsTo
	};
	const body = Object.keys(payload).map((key) => key + "=" + encodeURIComponent(payload[key])).join("&");
	const list = await fetch('https://plus.e-shishobako.ne.jp/dp-uw/v1/DPAW010501010', {method: 'POST', headers, body}).then(response => response.json());
	if (list['code'] != "200000") {
		console.error(list['message']);
	}
	console.log('%d documents found.', list['allCountKen']);
	return list;
}

async function loadKofuDetail(outlist) {
	const payload = {
		_csrf: sessionStorage.getItem("dp-csrf"),
		riyoCd: sessionStorage.getItem("dp-riyoCd"),
		userTokuteiId: outlist['userTokuteiId'],
		sCd: outlist['sCd'],
		sBaseDate: outlist['sBaseDate'],
		sCdSeq: outlist['sCdSeq']
	};
	const body = Object.keys(payload).map((key) => key + "=" + encodeURIComponent(payload[key])).join("&");
	const detail = await fetch('https://plus.e-shishobako.ne.jp/dp-uw/v1/DPAW010501080', {method: 'POST', headers, body}).then(response => response.json());
	if (detail['code'] != "200000") {
		console.error(detail['message']);
	}
	return detail;
}

async function loadAttachedFile(outlist, sIntFileId, fileName) {
	const payload = {
		_csrf: sessionStorage.getItem("dp-csrf"),
		riyoCd: sessionStorage.getItem("dp-riyoCd"),
		userTokuteiId: outlist['userTokuteiId'],
		sCd: outlist['sCd'],
		sBaseDate: outlist['sBaseDate'],
		sCdSeq: outlist['sCdSeq'],
		sTypeCd: '',
		sIntFileIds: sIntFileId,
		xmlPreviewFlg: 0
	};
	const body = Object.keys(payload).map((key) => key + "=" + encodeURIComponent(payload[key])).join("&");
	console.log('downloading file: %s.', fileName);
	const data = await fetch('https://plus.e-shishobako.ne.jp/dp-uw/v1/DPAW010501020', {method: 'POST', headers, body}).then(response => response.blob());
	const header = await data.text();
	if (!header.startsWith('%PDF-') && !header.startsWith('<?xml ')) {
		console.error('attached file is not PDF or XML.');
	}
	return data;
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

loadScripts();

let from = 20230101;
let to = 20230131;

async function dl(from, to) {
	const zip = new JSZip();
	const zipFileName = "e-私書箱-" + from + "-" + to + ".zip";
//	const folderName = "folder";
//	const folder = zip.folder(folderName);
	const folder = zip;

	const list = await loadKofuList(from, to);
	for (let i = 0; i < list['outlist'].length; i++) {
		let outlist = list['outlist'][i];
		let detail = await loadKofuDetail(outlist);
		for (let j = 0; j < detail['kofuDetailList'].length; j++) {
			let fileName = outlist['kofuHms'] + '-' + outlist['sName'] + '-' + detail['kofuDetailList'][j]['sOriFileId'];
			let data = await loadAttachedFile(outlist, detail['kofuDetailList'][j]['sIntFileId'], fileName);
//			let dt = new Date(outlist['kofuHms'].replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$4:$5:00 $2/$3/$1'));
			let dt = new Date(outlist['kofuHms'].replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/, '$1-$2-$3T$4:$5:00.000Z'));	// ISO 8601 UTC
			folder.file(fileName, data, { date: dt });
			await sleep(1000);
		}
	}

	console.log('generating zip file.');
	zip.generateAsync({ type: "blob" }).then(blob => {
		console.log('downloading zip file: %s.', zipFileName);
		saveAs(blob, zipFileName);
		console.log('done.');
	});
}

// 使用方法： await dl(from, to);
// 　　from, to: 交付期間（開始日、終了日）をYYYYMMDDで指定

