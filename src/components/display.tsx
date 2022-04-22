/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import app, { Component } from 'apprun';
import { ITile, mapTiles } from '../tiler';

export default class Display extends Component {
  state = {
    original: 'https://via.placeholder.com/160x144/e0f8d0/346856?text=placeholder',
    options: [],
  };
  private fileImput:HTMLInputElement;
  private placeholder:HTMLImageElement;
  private canvas:HTMLCanvasElement;
  private context:CanvasRenderingContext2D;
  constructor(...p){
    super(...p);
    this.fileImput = document.createElement('input');
    this.fileImput.type = 'file';
    this.fileImput.style.display = 'none';
    this.fileImput.addEventListener('change', e => this.handleFiles(e), false);
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.placeholder = new Image();
    this.placeholder.addEventListener('load', () => {
      this.canvas.width = this.placeholder.width;
      this.canvas.width = this.placeholder.height;
      this.context.drawImage(this.placeholder, 0, 0, this.placeholder.width, this.placeholder.height);
    });
    this.placeholder.src = this.state.original;
  }

  view = (state = this.state) => {
    return (
      <div class='Display' $ondragover={(s,e) => this.handleDragOver(e)} $ondragleave={(s,e) => this.handleDragLeave(e)} $ondrop={(s,e) => this.handleDrop(e)} $onmousedown={(s,e) => this.handleMouseDown(e)} $onclick={(s,e) => this.handleOnClick(e)}>
        {this.canvas}
        {this.fileImput}
      </div>
    );
  };

  handleDragOver(e) {
    console.log('handleDragOver',e);
    e.stopPropagation();
    e.preventDefault();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleDragLeave(e) {
    console.log('handleDragLeave',e);
    return e;
  }

  handleDrop(e) {
    console.log('handleDrop',e);
    e.stopPropagation();
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (!file || !file.type.match('image')) {
      return;
    }

    this.handleFileLoad(file);
  }

  handleMouseDown(e) {
    console.log('handleMouseDown',e);
    const img = new Image();
    img.onload = function () {
      this.onload = null;
    };
    img.src = e.target.dataset.imgUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleOnClick(e) {
    console.log('handleOnClick',e);
    document.getElementById('file').click();
  }

  handleFiles(e) {
    console.log('handleFiles',e);
    const fileList = e.target.files; /* now you can work with the file list */
    const file = fileList[0];
    this.handleFileLoad(file);
  }

  handleFileLoad(file) {
    console.log('handleFileLoad',file);
    // get the image placeholder
    const img = this.placeholder as HTMLImageElement;
    const reader = new FileReader();

    reader.onload = () => {
      // file load
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.renderTiles(mapTiles(img));
      };
      img.src = reader.result.toString();
    };
    reader.readAsDataURL(file);
  }

  renderTiles(map: {[key:string]:ITile }) {
    Object.values(map).forEach((tile) => {
      tile.coords.forEach((cord) => {
        this.context.putImageData(tile.tileData, cord.x*8, cord.y*8);
      });
    });
  }

  update = {
  };
}