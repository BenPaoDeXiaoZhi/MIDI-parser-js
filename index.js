(()=>{
const HEADER_CHUNK = "hd";
const TRACK_CHUNK = "rk";
const CHUNK_TYPES = {
  MThd:HEADER_CHUNK,
  MTrk:TRACK_CHUNK
};

class PointerView{
  constructor(buffer){
    this.view = new DataView(buffer);
    this.pointer = 0;
  }
  
  readAscii(bytes=1){
    let ret = "";
    for(let i=0; i<bytes; i++){
      ret += String.fromCharCode(this.readUint8());
    }
    return ret;
  }
  
  readUint32(){
    this.pointer += 4;
    return this.view.getUint32(this.pointer-4);
  }
  
  readUint16(){
    this.pointer += 2;
    return this.view.getUint16(this.pointer-2);
  }
  
  readUint8(){
    return this.view.getUint8(this.pointer++)
  }
  
  readHex(bytes=1){
    let ret = "";
    for(let i=0; i<bytes; i++){
      ret += this.readUint8().toString(16).padStart("0",2);
    }
    return ret;
  }
}

const form = document.getElementById("form");
const input = document.getElementById("input");
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const file = input.files[0];
  if(!!!file){
    alert("pls select file!");
  }
  console.log(file);
  file.arrayBuffer().then(parse);
})

function parse(buf){
  const view = new PointerView(buf);
  const config = {
    delay: null,
    tracks: null,
  }
  console.log(readChunk(view, config));
  console.log(readChunk(view, config));
}

function readChunk(view, config){
  const chunk = {
    type: null,
    length: null,
  };
  const typeId = view.readAscii(4);
  chunk.type = CHUNK_TYPES[typeId];
  chunk.length = view.readUint32();
  if(chunk.type == HEADER_CHUNK){
    if(config.delay){
      throw new Error("too many headers");
    }
    readHeader(view, chunk);
    config.delay = chunk.delay;
    config.tracks = chunk.tracks;
  }
  else if(chunk.type == TRACK_CHUNK){
    readCommand(view);
  }
  return chunk;
}

function readHeader(view, chunk){
  chunk.format = view.readUint16();
  chunk.tracks = view.readUint16();
  chunk.time = view.readUint16();
  console.log(chunk.time.toString(2).padStart("0",16));
  if(chunk.time >> 15 == 0){
    chunk.tpb = chunk.time;
    chunk.delay = 5/chunk.tpb;
  }
  return chunk;
}

function readCommand(view){
  const command = {
    type: null,
    delta: null,
  }
  let type;
  const delta = readDelta(view);
  console.log(delta, view.readHex(10));
}

function readDelta(view){
  let delta=0;
  const mask = 0xff >> 1 // last 7 bit
  while(1){
    const time = view.readUint8();
    delta = delta << 7 + time & mask;
    if(time>>7 == 0){ // 0xxxxxxx
      break
    }
  }
  return delta
}

})()