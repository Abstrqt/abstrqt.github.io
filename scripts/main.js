var globalslides = ["null"];
var scripts = {
  "load": "function(e, prez) {prez.pause();var track = window.prompt(\"Enter your slides seperated by commas followed by a space i.e. 1, 2, 4, 7, 9, 11, 13 (make sure to include the first and last slides: 1 and 13): \");   \nvar list = track.split(\", \");var visit = \"Slides you will visit: \\n\";for(let i=0; i<list.length; i++){visit += \"Slide \"+list[i]+\"\\n\";}\nalert(visit);console.log(visit);prez.variable(\"track\", track);}",
  "jump": "function(e, prez) {var previousIndex = prez.variable(\"previousIndex\");var previous = prez.variable(\"previous\");var current = prez.currentSlideIndex();\nconsole.log(\"Previous index: \" + previousIndex);console.log(\"Previous: \" + previous);console.log(\"Current: \" + current);\nvar track = prez.variable(\"track\").split(\", \");prez.variable(\"previous\", current);if(current>=previous && current!=track[previousIndex] && current!=track[track.length-1]){previousIndex++;\nprez.variable(\"previousIndex\", previousIndex);if(current!=track[previousIndex]){console.log(\"Go to \" + track[previousIndex]);\nprez.showSlideAt(track[previousIndex]);}}if(current<previous && current!=track[previousIndex]){previousIndex--;prez.variable(\"previousIndex\", previousIndex);\nif(current!=track[previousIndex]){console.log(\"Go to \" + track[previousIndex]);prez.showSlideAt(track[previousIndex]);}}}",
  "incorrect": "function(e, prez){var track = prez.variable(\"track\").split(\", \");if(this.score()==2){track.splice(prez.variable(\"previousIndex\")+1, 0, \"8\")}\nelse if(this.score()==3){track.splice(prez.variable(\"previousIndex\")+1, 0, \"8\", \"9\")}else if(this.score()==4){\ntrack.splice(prez.variable(\"previousIndex\")+1, 0, \"5\", \"6\", \"7\", \"8\", \"9\")}console.log(track);prez.variable(\"track\", track.join(\", \"))}"
}

document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
  const dropZoneElement = inputElement.closest(".drop-zone");

  dropZoneElement.addEventListener("click", (e) => {
    inputElement.click();
  });

  inputElement.addEventListener("change", (e) => {
    if (inputElement.files.length) {
      if(inputElement.files[0].type == "application/x-zip-compressed") updateThumbnail(dropZoneElement, inputElement.files[0]);
      else invalidate();
    }
  });

  dropZoneElement.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneElement.classList.add("drop-zone--over");
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {
      dropZoneElement.classList.remove("drop-zone--over");
    });
  });

  dropZoneElement.addEventListener("drop", (e) => {
    e.preventDefault();

    if (e.dataTransfer.files.length) {
      if(e.dataTransfer.files[0].type == "application/x-zip-compressed"){
        inputElement.files = e.dataTransfer.files;
        updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
      }
      else invalidate();
    }

    dropZoneElement.classList.remove("drop-zone--over");
  });
});

[document.getElementById("lrs"), document.getElementById("auth"), document.getElementById("jump"), document.getElementById("incorrect")].forEach((element) => {
  element.addEventListener("input", (e) => {
    readInput(element);
  });
});

checkboxElement = document.getElementById("check");
checkboxElement.addEventListener("change", (e) => {
  readInput(checkboxElement);
});

document.getElementById("submit").addEventListener("click", (e) => {
  injectScripts();
});
  
/**
 * Updates the thumbnail on a drop zone element.
 *
 * @param {HTMLElement} dropZoneElement
 * @param {File} file
 */
function updateThumbnail(dropZoneElement, file) {
  let fileElement = dropZoneElement.querySelector(".file");

  // First time - remove the prompt
  if (dropZoneElement.querySelector(".drop-zone__text")) {
    dropZoneElement.querySelector(".drop-zone__text").classList.add("hide");
  }

  // First time - there is no thumbnail element, so lets create it
  if (!fileElement) {
    fileElement = document.createElement("div");
    fileTextElement = document.createElement("p");
    fileIconElement = document.createElement("i");
    fileElement.classList.add("file");
    fileTextElement.classList.add("file-text")
    fileIconElement.classList.add("fa", "fa-file-zipper");
    dropZoneElement.appendChild(fileElement);
    fileElement.appendChild(fileIconElement);
    fileElement.appendChild(fileTextElement);
  }

  fileTextElement.innerHTML = file.name;
  readZip(file)
}

function readZip(file){
  JSZip.loadAsync(file).then(function(extract) {
    if(Object.keys(extract.files).includes("rlprez.js")){
      extract.files["rlprez.js"].async("string").then(function(filedata) {
        // estimate number of hooks
        var hooks = (filedata.match(/,-1,0\]/g) || []).length;
        // check number of hooks for redundancy
        for(let i=hooks; i>0; i--){
          str = "\\["+(i-1)+",-1,0\\]"
          count = (filedata.match(new RegExp(str, "g")) || []).length;
          if(count==i){
            hooks = i;
            break;
          }
        }
        // number of slides
        var slides = (filedata.match(/at:"Slide\s/g) || []).length;
        // classify hooks available for each slide
        var indexArray = new Array(slides+1).fill(0);
        var hookArray = new Array(slides+1).fill(0);
        for(let i=0; i<indexArray.length; i++){
          indexArray[i] = filedata.indexOf("at:\"Slide "+(i+1));
        }
        indexArray[indexArray.length-1] = filedata.length;
        var last = 0;
        for(let i=0; i<hooks; i++){
          hookArray[i] = indexArray.findIndex((currentNum) => filedata.indexOf("["+(hooks-1)+",-1,0]", last) <= currentNum);
          last = filedata.indexOf("["+(hooks-1)+",-1,0]", last) + 1;
        }
        if(hookArray.every(item => item === 0)) globalslides = ["null"];
        else globalslides = hookArray;
        var temp = filedata.substring(filedata.indexOf("\"", filedata.indexOf("[\"LRS\",")+6)+1);
        temp = temp.substring(0, temp.indexOf("\""));
        document.getElementById("lrs").value = temp;
        temp = filedata.substring(filedata.indexOf("\"", filedata.indexOf("[\"LRSAuth\",")+10)+1);
        temp = temp.substring(0, temp.indexOf("\""));
        document.getElementById("auth").value = temp;       
        updateDisplay(globalslides); 
      });
    }
    else invalidate("Could Not Locate rlprez.js");
  });
}

function updateDisplay(hookslides=slides){
  if(hookslides[0]!="null"){
    blockInputs(false);
    if(hookslides.length == 0 && globalslides.length != 0) document.getElementById("submit").disabled = false;
    document.getElementById("hooks__display").innerHTML = hookslides.length;
    document.getElementById("slides__display").innerHTML = hookslides.join(", ");
  }
  else{
    blockInputs(true);
    document.getElementById("hooks__display").innerHTML = "0";
    document.getElementById("slides__display").innerHTML = "null";    

  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Turns drop zone red with invalid message.
 */
async function invalidate(msg="Invalid Zip File!"){
  updateDisplay(["null"]);
  dropZoneElement = document.getElementById("drop-zone");
  if(dropZoneElement.querySelector(".file")){
    dropZoneElement.removeChild(dropZoneElement.querySelector(".file"));
  }
  dropZoneElement.classList.add("drop-zone__invalid");
  document.getElementById("drop-zone__text").classList.add("hide");
  invalidElement = document.createElement("p");
  invalidElement.innerHTML = msg;
  dropZoneElement.appendChild(invalidElement);
  await sleep(2500);
  dropZoneElement.classList.remove("drop-zone__invalid");
  document.getElementById("drop-zone__text").classList.remove("hide");
  dropZoneElement.removeChild(invalidElement);
}

function blockInputs(toggle){
  [document.getElementById("lrs"), document.getElementById("auth"), document.getElementById("check"), document.getElementById("jump"), document.getElementById("incorrect")].forEach(
    (element) => {
      element.disabled = toggle;
      if(toggle){
        element.value = null;
        element.checked = false;
      }
    });
  document.getElementById("submit").disabled = true;
}

function readInput(input){
  if(input.id == "jump" || input.id == "incorrect"){
    input.value = removeMiscChar(input.value);
  }
  processInputs();
}

function processInputs(){
  var all = [];
  if(document.getElementById("check").checked) all.push(0);
  [document.getElementById("jump"), document.getElementById("incorrect")].forEach((element) => {
    all = all.concat(convert(element.value));
  });
  useInput(all);
}

function convert(input){
  var out = [];
  input = input.split(",");
  input.forEach(values => {
    values = values.split("-");
    var range = [];
    for(let i=parseInt(values[0]); i<=parseInt(values[1]); i++){
      range.push(i);
    }
    if(range.length != 0) out = out.concat(range);
    else out = out.concat(parseInt(values));
  });
  return out;
}

function useInput(input){
  var slides = [...globalslides];
  for(let i=0; i<input.length; i++){
    if(slides.indexOf(input[i]) > -1) slides.splice(slides.indexOf(input[i]), 1);
  }
  updateDisplay(slides);
}

function removeMiscChar(string){
  string = string.replace(/\s+/g, '');
  for(let i=0; i<string.length; i++){
      if(isNaN(string.substring(i, i+1)) && string.substring(i, i+1) != "-" && string.substring(i, i+1) != ","){
        string = string.substring(0, i) + string.substring(i+1);
        i--;
      }
  }
  return string;
}

async function injectScripts(){
  var file = document.getElementById("file").files[0];
  JSZip.loadAsync(file).then(function(extract) {
    if(Object.keys(extract.files).includes("rlprez.js")){
      extract.files["rlprez.js"].async("string").then(function(filedata) {
        var js = filedata;
        var find = "["+(globalslides.length-1)+",-1,0]";
        var counter = 0;
        while(js.indexOf(find)!=-1){
          js = js.substring(0, js.indexOf(find))+"["+(globalslides.length-1)+", "+counter+", 0]"+js.substring(js.indexOf(find)+find.length);
          counter++;
        }
        
        try{
          var i = js.indexOf("f = [");
          for(let x=i; x>=0; x--){
            if(js.substring(x, x+1) == ","){
              i=x;
              break;
            }
          }
          js = js.substring(0,i)+js.substring(js.indexOf("d.f = f;")+8);
        }
        catch(e){
          console.log(e);
        }
        i = js.indexOf("AP.loadedPrezs.push(d);");
        js = js.substring(0, i-1)+"d.f = ["+getConstructed()+"];\n\n"+js.substring(i); 

        var temp = js.substring(js.indexOf("\"", js.indexOf("[\"LRS\",")+6)+1);
        js = js.substring(0, js.indexOf("\"", js.indexOf("[\"LRS\",")+6)+1) + document.getElementById("lrs").value + temp.substring(temp.indexOf("\""));
        temp = js.substring(js.indexOf("\"", js.indexOf("[\"LRSAuth\",")+10)+1);
        js = js.substring(0, js.indexOf("\"", js.indexOf("[\"LRSAuth\",")+10)+1) + document.getElementById("auth").value + temp.substring(temp.indexOf("\""));
        console.log(js);
        extract.file("rlprez.js", js);
        toggleModal();
        extract.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, "output.zip");
            toggleModal();
        });
        
      });
    }
  });
}

function toggleModal(){
  document.querySelector('.container').classList.toggle('container-blur');
  document.querySelector('.modal-wrapper').classList.toggle('modal--active');
}

function getConstructed(){
  var output = "";
  if(document.getElementById("check").checked) output += scripts["load"] + ", \n";
  var jump = convert(document.getElementById("jump").value);
  var incorrect = convert(document.getElementById("incorrect").value);

  [jump, incorrect].forEach((arr) => {
    for(let i=0; i<arr.length; i++){
      if(globalslides.indexOf(arr[i]) == -1){
        arr.splice(i, 1);
        i--;
      }
    }
  });

  var max = Math.max(Math.max.apply(null, jump), Math.max.apply(null, incorrect));

  for(let i=0; i<=max; i++){
    if(incorrect.indexOf(i) != -1) output += scripts["incorrect"] + ", \n";
    if(jump.indexOf(i) != -1) output += scripts["jump"] + ", \n";
  }
  return output;
}