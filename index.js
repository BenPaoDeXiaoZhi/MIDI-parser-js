(()=>{
const HEADER_CHUNK = "hd";
const TRACK_CHUNK = "rk";
const CHUNK_TYPES = {
  MThd:HEADER_CHUNK,
  MTrk:TRACK_CHUNK
};
const BYTE_NUMS = {
  8: 2,
  9: 2,
  a: 2,
  b: 2,
  c: 1,
  d: 1,
  e: 2
}

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
      ret += this.readUint8().toString(16).padStart(2, "0");
    }
    return ret;
  }
}

const form = document.getElementById("form");
const input = document.getElementById("input");
const result=document.getElementById("result");
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const file = input.files[0];
  if(!!!file){
    alert("pls select file!");
  }
  console.log(file);
  file.arrayBuffer().then(buf=>{
    const dat=parse(buf);
    console.log(dat)
    result.value = compile(dat);
  });
})

function compile(dat){
  let ret = `let B=0;\n`
  let mspb = 500;
  if(dat.tracks==1){
    const track = dat.trackDat[0]
    for(const cmd of track.commands){
      const {type, metaType, args, delta} = cmd;
      console.log(cmd)
      switch(type){
        case "ff":
          if(metaType == "51"){
            const usPerBeat = 
              (args[0] << 16) +
              (args[1] << 8)  +
              args[2]
            console.log(usPerBeat);
            mspb = usPerBeat * 1000;
          }
          break
        case "90":
          if(delta){
            ret += `basic.pause(${mspb * delta / dat.tpb});\n`
          }
          if(args[1] > 20){
            ret += `music.ringTone(${Math.round(2 ** ((args[0]-64) / 12) * 440)});\n`
          }
          else{
            ret += "music.stopAllSounds();\n"
          }
      }
    }
  }
  console.log(ret);
  return ret
}

function parse(buf){
  const view = new PointerView(buf);
  const config = {
    tpb: null,
    tracks: null,
    trackDat: [],
  }
  readChunk(view, config);
  for(let i=0;i<config.tracks;i++){
    config.trackDat.push(readChunk(view, config))
  }
  return config;
}

function readChunk(view, config){
  const chunk = {
    type: null,
    length: null,
    commands: []
  };
  const typeId = view.readAscii(4);
  chunk.type = CHUNK_TYPES[typeId];
  chunk.length = view.readUint32();
  if(chunk.type == HEADER_CHUNK){
    if(config.delay){
      throw new Error("too many headers");
    }
    readHeader(view, chunk);
    config.tpb = chunk.tpb; // 一个四分音符的tick数
    config.tracks = chunk.tracks;
  }
  else if(chunk.type == TRACK_CHUNK){
    while(1){
      const cmd=readCommand(view);
      chunk.commands.push(cmd);
      if(cmd.metaType=="2f"){
        break;
      }
    }
  }
  return chunk;
}

function readHeader(view, chunk){
  chunk.format = view.readUint16();
  chunk.tracks = view.readUint16();
  chunk.time = view.readUint16();
  if(chunk.time >> 15 == 0){
    chunk.tpb = chunk.time; // tick per beat
  }
  return chunk;
}

function readCommand(view){
  const delta = readDelta(view);
  let type = view.readHex(1);
  const args = [];
  let metaType;
  if(type[0] != "f"){
    for(let i=0;i<BYTE_NUMS[type[0]];i++){
      args.push(view.readUint8());
    }
  }
  else if(type == "f0"){
    for(let arg=view.readUint8();arg != 0xf7;arg=view.readUint8()){
      args.push(arg);
    }
    view.pointer--;
  }
  else{ // meta
    metaType = view.readHex(1);
    const length=view.readUint8();
    for(let i=0;i<length;i++){
      args.push(view.readUint8());
    }
  }
  const command = {
    type, // str
    delta,
    args,
    metaType // str
  }
  return command;
}

function readDelta(view){
  let delta=0;
  const mask = 0xff >> 1 // last 7 bit
  while(1){
    const time = view.readUint8();
    delta = (delta << 7) + (time & mask);
    if(time>>7 == 0){ // 0xxxxxxx
      break
    }
  }
  return delta
}

})()