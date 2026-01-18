(()=>{

class PointerView{
  constructor(buffer){
    this.view = new DataView(buffer);
    this.pointer = 0;
  }
  readAscii(bytes=1){
    const ret = "";
    for(const end=this.pointer+bytes; this.pointer<end; this.pointer++){
      ret += String.fromCharCode(this.view.getUint8(this.pointer));
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
  const arrayBuffer = file.arrayBuffer();
  const view = new PointerView(arrayBuffer);
  console.log(view, view.readAscii(4));
})

})()