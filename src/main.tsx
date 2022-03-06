import app from 'apprun';
import Display from './components/display';

app.render(document.getElementById('main'), <div id="view-container" class="row container">
  <div id="view" class="cell">
    <Display/>
  </div>
  <div id="menu" class="cell">
    <form class="form">
      <div class="row">
        <div class="cell padded">
          <label class="label" for="count">Unique Tiles Count:<br/></label>
          <input placeholder="" name="count" type="number" class="input" id="count" disabled value="321"/>
        </div>
        <div class="cell padded">
          <label class="label" for="targget">Targget Unique Tiles:<br/></label>
          <input placeholder="" name="targget" type="number" required class="input" id="targget"/>
        </div>
      </div>
      <div class="form-group">
      </div>
      <div class="form-group">
        <button type="submit" class="button">Compress</button>
      </div>
    </form>
  </div>
</div>);
