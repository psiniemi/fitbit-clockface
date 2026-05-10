import { peerSocket } from "messaging";
import { WEATHER_MESSAGE_KEY, WEATHER_DATA_FILE, WEATHER_ERROR_FILE } from './common.js';
import { inbox } from "file-transfer";
import { readFileSync } from "fs";

const MY_FILE_NAMES = [WEATHER_DATA_FILE, WEATHER_ERROR_FILE];

let otherFiles = [];
let myFiles    = [];

const prevNextFile = inbox.nextFile;

inbox.nextFile = function() {
  if (otherFiles.length > 0) {
    return otherFiles.pop();
  }

  var fileName;
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      myFiles.push(fileName);
    }
    else {
      return fileName;
    }
  }
  return undefined;
};

const getCustomFile = function() {
  if (myFiles.length > 0) {
    return myFiles.pop();
  }

  var fileName;
  while (fileName = prevNextFile()) {
    if (MY_FILE_NAMES.indexOf(fileName) > -1) {
      return fileName;
    }
    otherFiles.push(fileName);
  }
  return undefined;
};

export default class Weather {

  constructor() {
    this._maximumAge = 300000;
    this._pendingFetch = false;

    try {
      this._weather = readFileSync(WEATHER_DATA_FILE, "cbor");
    } catch (n) {
      this._weather = undefined;
    }

    this.onerror = undefined;
    this.onsuccess = undefined;

    inbox.addEventListener("newfile", (event) => {
      var fileName = getCustomFile();
      if (fileName === WEATHER_DATA_FILE) {
        this._weather = readFileSync(fileName, "cbor");
        if (this.onsuccess) this.onsuccess(this._weather);
      }
      else if (fileName === WEATHER_ERROR_FILE) {
        if (this.onerror) this.onerror(readFileSync(fileName, "cbor").error);
      }
    });

    peerSocket.addEventListener("open", () => {
      if (this._pendingFetch) {
        this._pendingFetch = false;
        this._sendFetchMessage();
      }
    });
  }

  _sendFetchMessage() {
    let message = {};
    message[WEATHER_MESSAGE_KEY] = 1;
    peerSocket.send(message);
  }

  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }

  getData() {
    return this._weather;
  }

  fetch() {
    let now = Date.now();
    if (this._weather !== undefined && this._weather.timestamp !== undefined && (now - this._weather.timestamp < this._maximumAge)) {
      if (this.onsuccess) this.onsuccess(this._weather);
      return this._weather;
    }

    if (peerSocket.readyState === peerSocket.OPEN) {
      this._sendFetchMessage();
    }
    else {
      this._pendingFetch = true;
    }
    return this._weather;
  }
};
