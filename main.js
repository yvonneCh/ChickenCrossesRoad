/*********************************
 * Includes
 ***********************************/

function load(script) {
  document.write('<'+'script src="'+script+'" type="text/javascript"><' + '/script>');
}

load('game_dependencies/Shapes.js');
load('game_dependencies/Graphics_Stack.js');
load('game_dependencies/Basic_Component.js');
load('game_dependencies/Transition.js');

load('game_view_components/Car.js');

load('game_view_components/terrain/Ground_Base.js');
load('game_view_components/terrain/Ground_Strip.js');
load('game_view_components/terrain/Street_Strip.js');
load('game_view_components/terrain/Water_Strip.js');
load('game_view_components/terrain/Grass_Strip.js');
load('game_view_components/terrain/Ground.js');

load('game_view_components/Player.js');
load('game_view_components/Interaction_Controller.js');

/*********************************
 * Main Scene
 ***********************************/

class Main_Scene extends Scene_Component {

  translate(x, y, z) {
    return Mat4.translation(Vec.of(x, y, z));
  }
  scale(x, y, z) {
    return Mat4.scale(Vec.of(x, y, z));
  }
  rotate(angle, x, y, z) {
    return Mat4.rotation(angle, Vec.of(x, y, z));
  }
  
  /**
   * submits shapes, sets the graphic state, saves the textures
   */
  constructor(context) { 
    super(context);
    this.submit_shapes(context, getShapes())
    this.context = context;
    this.initDisplay = false;
    this.playerMovementDisabled = false;
    this.stack = new Graphics_Stack();

    Object.assign(
      context.globals.graphics_state, {
        camera_transform: Mat4.translation([ 0, -20, -50 ]),
        projection_transform: Mat4.perspective( Math.PI/4, context.width/context.height, .1, 1000 )
      }
    );
      }

  reset() {
    this.ground = null;
    this.player = null;
    this.initDisplay = false;
    this.stack = new Graphics_Stack();
  }

  /**
   * draws lights
   */
  draw_lights(graphics_state) {
    graphics_state.lights = [
      new Light( Vec.of( 1,1,2, 0 ).normalized(), Color.of( 0.5, 0.5, 0.5,  1 ), 100000000 ),
      new Light( Vec.of( 0,1,0, 0 ).normalized(), Color.of( 0.5,  0.5, 0.5, 1 ), 100000000 )
    ];
  }

  /**
   * init objects, called only once
   */
  init_objects(graphics_state, model_transform) {
    
    this.ground = new Ground(this.context, graphics_state, model_transform, this.stack);
    this.player = new Player(this.context, graphics_state, model_transform, this.stack);
    this.interaction = new Interaction_Controller(this, this.player, this.ground);
  }

  update_objects() {
    if (this.player)
      this.player.draw(this.t);
    if (this.ground)
      this.ground.draw(this.t);
  }

  getCameraZ() {
    // handle camera transitions
    if (!this.transition) {
      this.transition = new Transition(this.player.curZ, this.player.curZ, 1, this.t);
    }

    let cameraTransitionZ = this.transition.value(this.t);

    if (cameraTransitionZ != this.player.curZ && !this.transition.isTransitioning) {
      this.transition = new Transition(cameraTransitionZ, this.player.curZ, 250, this.t);
    }
    else if(cameraTransitionZ != this.player.curZ && this.transition.isTransitioning) {
      this.transition.updateEnd(this.player.curZ);
    }
    else if (cameraTransitionZ == this.player.curZ) {
      this.transition.isTransitioning = false;
    }
    return -this.transition.value(this.t) * 2;
  }

  /**
   * display function
   */
  display( graphics_state ) {
    this.draw_lights(graphics_state);
    this.t = graphics_state.animation_time;
    this.dt = graphics_state.animation_delta_time / 1000;


    let model_transform = Mat4.identity();

    if (!this.initDisplay) {
      this.init_objects(graphics_state, model_transform);
      this.initDisplay = true;
    }

    let cameraZ = this.getCameraZ();
    graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 30, 10 + cameraZ), Vec.of(0, 0, cameraZ), Vec.of(0, 1, 0));
    this.update_objects();
  }

  disableGame() {
    this.playerMovementDisabled = true;
  }

  enableGame() {
    this.playerMovementDisabled = false;
    document.querySelector('.game-over').classList.remove('show');
  }

  /*
   * This function of a scene sets up its keyboard shortcuts.
   */
  make_control_panel() {

    document.querySelector('.reset').addEventListener('click', () => {
      this.enableGame();
    });

    document.addEventListener('keyup', () => {
      document.querySelectorAll('.letter').forEach(ele => {
        ele.classList.remove('pressed')
      });
    });

    document.addEventListener('keydown', e => {

      let keynum;
        if(window.event) { // IE                    
          keynum = e.keyCode;
        } else if(e.which){ // Netscape/Firefox/Opera                   
          keynum = e.which;
        }
        let pressedKey = String.fromCharCode(keynum);
        let didPressMovementKey = false;

        if (!this.playerMovementDisabled) {
          switch(pressedKey) {
            case 'W':
              this.player.goForward(this.t);
              didPressMovementKey = true;
              break;
            case 'S':
              this.player.goBackward(this.t);
              didPressMovementKey = true;
              break;
            case 'D':
              this.player.goRight(this.t);
              didPressMovementKey = true;
              break;
            case 'A':
              this.player.goLeft(this.t);
              didPressMovementKey = true;
              break;
          }

          if (didPressMovementKey) {
            document.querySelector('#' + pressedKey).classList.add('pressed');
          }
        }
        
    });

  }

}