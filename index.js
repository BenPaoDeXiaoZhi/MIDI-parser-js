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
    for(const end=this.pointer+bytes; this.pointer<end; this.pointer++){
      ret += String.fromCharCode(this.view.getUint8(this.pointer));
    }
    return ret;
  }
  
  readUint32(){
    return this.view.getUint32(this.pointer++)
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
  return chunk
}

})()