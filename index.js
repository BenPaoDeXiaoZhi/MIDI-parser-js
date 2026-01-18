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
  console.log(view, readChunk(view));
}

function readChunk(view){
  const chunk = {
    type: null,
    length: null,
  };
  const typeId = view.readAscii(4);
  chunk.type = CHUNK_TYPES[typeId];
  chunk.length = view.readUint32();
  if(chunk.type == HEADER_CHUNK){
    readHeader(view, chunk);
  }
  return chunk;
}

function readHeader(view, chunk){
  console.log("hd",chunk);
  chunk.format = view.readUint16();
  chunk.tracks = view.readUint16();
  return chunk;
}

})()