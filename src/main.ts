import { mapTiles } from './tiler';

function handleDragOver(e) {
  e.stopPropagation();
  e.preventDefault();
}

function handleDragLeave(e) {
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  const file = e.dataTransfer.files[0];

  if (!file || !file.type.match('image')) {
    return;
  }

  handleFileLoad(file);
}

function handleMouseDown(e) {
  const img = new Image();
  img.onload = function () {
    this.onload = null;
  };
  img.src = e.target.dataset.imgUrl;
}

function handleOnClick(e) {
  document.getElementById('file').click();
}

const  handleFiles = function () {
  const fileList = this.files; /* now you can work with the file list */
  const file = fileList[0];
  handleFileLoad(file);
};

const handleFileLoad = function (file) {
  // get the image placeholder
  const img = document.querySelector('#view img') as HTMLImageElement;
  const reader = new FileReader();

  reader.onload = function () {
    // file load
    img.onload = function () {
      mapTiles(img);
    };
    img.src = reader.result.toString();
  };
  reader.readAsDataURL(file);
};

const root = document.getElementById('view');
root.addEventListener('dragover', handleDragOver, false);
root.addEventListener('dragleave', handleDragLeave, false);
root.addEventListener('drop', handleDrop, false);
root.addEventListener('mousedown', handleMouseDown, false);
root.addEventListener('click', handleOnClick, false);

const inputElement = document.getElementById('file');
inputElement.addEventListener('change', handleFiles, false);
