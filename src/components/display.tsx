import app, { Component } from 'apprun';
import { mapTiles } from '../tiler';

export default class Display extends Component {
  state = {
    original: 'https://via.placeholder.com/160x144/e0f8d0/346856?text=placeholder',
    options: [],
    patios: [],
  };
  private fileImput:HTMLInputElement;
  private placeholder:HTMLImageElement;

  constructor(...p){
    super(...p);
    this.fileImput = document.createElement('input');
    this.fileImput.type = 'file';
    this.fileImput.style.display = 'none';
    this.fileImput.addEventListener('change', e => this.handleFiles(e), false);
    this.placeholder = document.createElement('img');
    this.placeholder.src = this.state.original;
  }

  view = (state = this.state) => {
    return (
      <div $ondragover={e => this.handleDragOver(e)} $ondragleave={e => this.handleDragLeave(e)} $ondrop={e => this.handleDrop(e)} $onmousedown={e => this.handleMouseDown(e)} $onclick={e => this.handleOnClick(e)}>
        {()=>{this.placeholder.src = state.original; return this.placeholder;}}
        {this.fileImput}
      </div>
    );
  };

  handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleDragLeave(e) {
    return e;
  }

  handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (!file || !file.type.match('image')) {
      return;
    }

    this.handleFileLoad(file);
  }

  handleMouseDown(e) {
    const img = new Image();
    img.onload = function () {
      this.onload = null;
    };
    img.src = e.target.dataset.imgUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleOnClick(e) {
    document.getElementById('file').click();
  }

  handleFiles(e) {
    const fileList = e.target.files; /* now you can work with the file list */
    const file = fileList[0];
    this.handleFileLoad(file);
  }

  handleFileLoad(file) {
    // get the image placeholder
    const img = this.placeholder as HTMLImageElement;
    const reader = new FileReader();

    reader.onload = function () {
      // file load
      img.onload = function () {
        mapTiles(img);
      };
      img.src = reader.result.toString();
    };
    reader.readAsDataURL(file);
  }

  update = {
  };
}