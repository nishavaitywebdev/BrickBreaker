/**
 *  The brick breaker application
 *
 *  @namespace BrickBreaker
 */
BrickBreaker = new function()
{
  //########################################
  //Private member variables
  //########################################

  //DOM Nodes
  var DOM = {
    platform: null,
    ball: null,
    bricks: null,
    message: null
  };

  //Messages
  var messages = {
    start: 'Press the spacebar to start the game',
    round_win: 'Round won! Press the spacebar to go to the next level',
    won: 'You\'ve won! Press the spacebar to play again',
    lost: 'Uh Oh you lost! Press the spacebar to play again'
  };

  /**
   *  Each level contains 4 rows of at most 8 bricks
   *
   *  Brick Values:
   *    0: none
   *    1: default
   *    2: strong block (2 hits needed)
   *    3: invuln block
   */
  var levels = [

    //Starting level
    [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 2, 2, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0]
    ],

    //Mid Level
    [
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 3, 3, 2, 2, 1],
      [2, 1, 2, 2, 2, 2, 1, 2],
      [0, 3, 1, 2, 2, 1, 3, 0]
    ],

    //Avd Level
    [
      [2, 2, 1, 1, 1, 1, 2, 2],
      [2, 2, 1, 2, 2, 1, 2, 2],
      [2, 2, 2, 3, 3, 2, 2, 2],
      [3, 1, 3, 3, 3, 3, 1, 3]
    ]
  ];

  //Current level index
  var current_level = 0;

  //Is the game in progress?
  var in_progress = false;

  /**
   *  When building the bricks based on the level, use this array to store brick info
   *
   *  Each item in the array should match the following format:
   *
   *  {
   *    elem: The HTMLElement
   *    rect: The rect provided by getBoundingClientRect(),
   *    type: The brick type:
   *      1: default
   *      2: strong
   *      3: invuln block
   *  }
   */
  var bricks = [];

  /**
   *  Keep track of the ball and platform directions
   *
   *  Value:
   *    -1: Ball or platform moving left
   *    0: Ball or platform not moving
   *    1: Ball or platform moving right
   */
  var tracking = {
    ball_x: 1,
    ball_y: 1,
    plat_x: 0
  };

  /**
   *  Modify the speed of the ball or platform
   *  A frame is rendered at roughly 60fps
   *
   *  1 second of movement = modifier * 60
   */
  var modifiers = {
    ball_x: 5,
    ball_y: 7,
    plat_x: 20
  };

  //########################################
  //Private member functions
  //########################################

  /**
   *  Initialize our first level
   *
   *  @private
   *
   *  @return {undefined}
   */
  function initialize()
  {
    //Get DOM nodes
    DOM.bricks = document.getElementById('bricks');
    DOM.ball = document.getElementById('ball');
    DOM.platform = document.getElementById('platform');
    DOM.message = document.getElementById('message');

    //Start
    showMessage('start');
    start();

    //Animate
    doAnimate();
  }

  /**
   *  Start the brick breaker game
   *
   *  @return {undefined}
   */
  function start(arg_message)
  {
    //Position platform
    positionPlatform();

    //Position ball
    positionBall();

    //Build the bricks
    buildBricks();
  }

  /**
   *  Reset the game
   *
   *  @private
   *
   *  @return {undefined}
   */
  function reset()
  {
    in_progress = false;
    tracking = {
      ball_x: 1,
      ball_y: 1,
      plat_x: 0
    };

    return start();
  }

  /**
   *  Show a message
   *
   *  @private
   *
   *  @param  {string} arg_message The message key to display, null hides the message
   *
   *  @return {undefined}
   */
  function showMessage(arg_message)
  {
    var message = messages[arg_message];
    if (!message) return DOM.message.classList.remove('active');

    DOM.message.innerHTML = message;
    DOM.message.classList.add('active');
  }

  /**
   *  Build the brick DOM nodes for the current level
   *
   *  @private
   *
   *  @return {undefined}
   */
  function buildBricks()
  {
    /**
     *
     *
     *  When adding elements to the <div id="bricks"> container follow this format:
     *    No Brick: <div class="empty"></div>
     *    Normal Brick: <div></div>
     *    Strong Brick: <div class="strong"></div>
     *    Strong HIT Brick: <div class="strong hit"></div>
     *    Invuln Brick: <div class="invuln"></div>
     *
     *  Be sure to:
     *    - Add brick elements to container
     *    - Set classes as needed
     *    - Store brick information in the bricks[] array
     */
     while (DOM.bricks.firstChild) DOM.bricks.removeChild(DOM.bricks.firstChild);
     // clear bricks array in case if it is a new level/reset
     bricks = [];
     // Go through each row of current level and construct and set
     // each brick by its type in bricks array
     levels[current_level].forEach((row) => {
       // initialize each brick row
       const brickRow = [];
       row.forEach((brickType) => {
         const brickElem = document.createElement("DIV");
         DOM.bricks.appendChild(brickElem);
         switch(brickType) {
           case 0:
             brickElem.className = "empty";
             brickRow.push({
               elem: brickElem,
               rect: brickElem.getBoundingClientRect(),
               type: 0
             });
             break;
           case 2:
             brickElem.className = "strong";
             brickRow.push({
               elem: brickElem,
               rect: brickElem.getBoundingClientRect(),
               type: 2
             });
             break;
           case 3:
             brickElem.className = "invuln";
             brickRow.push({
               elem: brickElem,
               rect: brickElem.getBoundingClientRect(),
               type: 3
             });
             break;
           default:
             brickRow.push({
               elem: brickElem,
               rect: brickElem.getBoundingClientRect(),
               type: 1
             });
         }
       });
       // push each brick row in bricks array
       bricks.push(brickRow);
     });
  }

  //########################################
  //Collision Detection
  //########################################

  /**
   *  Are two rects intersecting?
   *
   *  @private
   *
   *  @param  {object} arg_r1 The first rect
   *  @param  {object} arg_r2 The second rect
   *
   *  @return {boolean} True if they intersect, false otherwise
   */
  function isIntersecting(arg_r1, arg_r2)
  {
    // check if does not overlap by checking for left/right and top/bottom boundary distances
    // check for left side overlap
    const leftOverlap = arg_r1.right < arg_r2.left;
    // check for right side overlap
    const rightOverlap = arg_r1.left > arg_r2.right;
    // check for top side overlap
    const topOverlap = arg_r1.bottom < arg_r2.top;
    // check for bottom side overlap
    const bottomOverlap = arg_r1.top > arg_r2.bottom;

    // if any of the above are true then the rectangles do not intersect
    return !(leftOverlap || rightOverlap || topOverlap || bottomOverlap);
  }

  /**
   *  Should the ball reverse the X direction when it hits/intersects with another object
   *
   *  @private
   *
   *  @param  {object} arg_brect The ball rect
   *  @param  {object} arg_orect The object rect
   *
   *  @return {boolean} True if the ball should reverse direction, false otherwise
   */
  function shouldReverseX(arg_brect, arg_orect)
  {
    var reverse = false;
    //Hit right or left side?
    // if the intersection height is greater the reverse the X-direction
    const totalWidth = arg_brect.width + arg_orect.width;
    const totalHeight = arg_brect.height + arg_orect.height;
    const dx = totalWidth - Math.abs(arg_orect.left - arg_brect.left);
    const dy = totalHeight - Math.abs(arg_orect.top - arg_brect.top);
    reverse = dy >= dx;

    return reverse;
  }

  /**
   *  Should the ball reverse the Y direction when it hits/intersects with another object
   *
   *  @private
   *
   *  @param  {object} arg_brect The ball rect
   *  @param  {object} arg_orect The object rect
   *
   *  @return {boolean} True if the ball should reverse direction, false otherwise
   */
  function shouldReverseY(arg_brect, arg_orect)
  {
    let reverse = false;
    //Hit top or bottom side?
    // if the intersection width is greater the reverse the Y-direction
    const totalWidth = arg_brect.width + arg_orect.width;
    const totalHeight = arg_brect.height + arg_orect.height;
    const dx = totalWidth - Math.abs(arg_orect.left - arg_brect.left);
    const dy = totalHeight - Math.abs(arg_orect.top - arg_brect.top);
    reverse = dy <= dx;

    return reverse;
  }

  /**
   *  Checks the ball for any collisions between bricks, the platform, or the screen
   *
   *  The platform should not go past the screen boundaries
   *  If the ball hits an object it should change its direction
   *  If the ball goes past the platform and goes past the bottom edge, the game is over
   *  If the ball hits a brick:
   *    If its a normal brick, change the ball direction and hide the brick
   *    If its a strong brick, after one additional hit, change the ball direction and hide the brick
   *    If its an invuln brick, change the ball direction
   *
   *  @return {undefined}
   */
  function checkCollisions()
  {
    if (!in_progress) return;

    //Check screen collisions
    checkScreenCollisions();

    //Check platform collisions
    checkPlatformCollisions();

    //Check brick collisions
    checkBrickCollisions();
  }

  /**
   *  Check ball and platform collisions with the screen
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkScreenCollisions()
  {
    /**
     *
     *
     *  This function checks collisions between the ball/platform and the viewport
     *
     *  Since the platform only moves horizontally, you only need to check the X direction and use positionPlatform
     *  The ball moves in both the X and Y directions so be sure to set the X/Y tracking accordingly and use positionBall
     *
     *  If the ball goes PAST the platform and hits the bottom edge of the screen the game is over, reset the level to 0 and show a 'lost' message
     */
     // get ball and platform rectangles
     const ballRect = DOM.ball.getBoundingClientRect();
     const platformRect = DOM.platform.getBoundingClientRect();

     // get viewport height and width
     const windowWidth = window.innerWidth;
     const windowHeight = window.innerHeight;

     // check for platform bounds to be within viewport
     // Reposition platform if needed
     if(platformRect.left >= (windowWidth - platformRect.width))
       positionPlatform((windowWidth - platformRect.width), false);
     else if(platformRect.left <= 0) positionPlatform(0, false);

     // check for ball bounds to be within viewport and reverse direction if needed
     if(ballRect.left >= (windowWidth - ballRect.width)) {
       positionBall((windowWidth - ballRect.width), ballRect.top, false);
       tracking.ball_x = -tracking.ball_x;
     } else if (ballRect.left <= 0) {
       positionBall(0, ballRect.top, false);
       tracking.ball_x = -tracking.ball_x;
     }
     // when ball hits top of viewport then reposition and reverse direction of ball
     // if it goes past platform and beyond bottom of viewport then game over
     if(ballRect.top <= 0) {
       positionBall(ballRect.left, 0, false);
       tracking.ball_y = -tracking.ball_y;
     } else if(ballRect.top >= windowHeight) {
       current_level = 0;
       reset();
       showMessage('lost');
     }
  }

  /**
   *  Check the ball for collisions with the platform
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkPlatformCollisions()
  {
    /**
     *
     *
     *  This function checks collisions between the ball and the platform
     *
     *  Be sure to use isIntersecting and shouldReverseX/shouldReverseY to change the ball tracking modifier
     *  Also be sure to account for the platform movement that can also change the ball direction
     */
     const ballRect = DOM.ball.getBoundingClientRect();
     const platformRect = DOM.platform.getBoundingClientRect();
     if(isIntersecting(ballRect, platformRect)) {
       let posX = ballRect.left;
       let posY = ballRect.top;
       if(shouldReverseX(ballRect, platformRect)) {
         posX = ballRect.left > platformRect.left ? platformRect.right: platformRect.left-ballRect.width;
         tracking.ball_x = -tracking.ball_x;
       }
       if(shouldReverseY(ballRect, platformRect)) {
         posY = platformRect.top-ballRect.width;
         tracking.ball_y = -tracking.ball_y;
       }
       positionBall(posX, posY, false);
     }
  }

  /**
   *  Checks the ball for collisions with any visibile bricks and handle hit tracking
   *
   *  @private
   *
   *  @return {undefined}
   */
  function checkBrickCollisions()
  {
    /**
     *
     *
     *  This function checks collisions between the ball and the bricks[] array
     *
     *  Be sure to use isIntersecting and shouldReverseX/shouldReverseY to change the ball tracking modifier
     *  When a brick is hit be sure to set/remove/add the correct classes
     *  Follow this format:
     *    Normal -> Empty
     *    Strong HIT -> Normal
     *    Strong -> Strong HIT
     *    Invuln -> Invuln
     */
     // get ball rectangle
     const ballRect = DOM.ball.getBoundingClientRect();
     // go through bricks array to check for collisions
     bricks.forEach((brickRow) => {
       brickRow.forEach((brick) => {
         // bricks style will be changed based on intersection and their type
         if(isIntersecting(ballRect, brick.rect) && brick.type > 0) {
           if(brick.type == 1) {
             brick.elem.className = 'empty';
             brick.type = 0;
           } else if(brick.type == 2) {
             // handles the two hit requirement for Strong type of bricks
             brick.elem.className = (brick.elem.className === 'strong hit') ? 'normal': 'strong hit';
             brick.type = (brick.elem.className === 'strong hit') ? 2: 1;
           }
           // Handle the direction change on hitting the bricks
           let posX = ballRect.left;
           let posY = ballRect.top;
           //Reposition ball appropriately and reverse x and y if accordingly
           if(shouldReverseX(ballRect, brick.rect)) {
             posX = ballRect.left > brick.rect.left ? brick.rect.right: brick.rect.left-ballRect.width;
             tracking.ball_x = -tracking.ball_x;
           }
           if(shouldReverseY(ballRect, brick.rect)) {
             posY = ballRect.top > brick.rect.top ? brick.rect.bottom: brick.rect.top-ballRect.width;
             tracking.ball_y = -tracking.ball_y;
           }
           positionBall(posX, posY, false);
         }
       });
     });
  }

  //########################################
  //Event Handlers
  //########################################

  /**
   *  A keydown event was caught, handle it
   *
   *  @private
   *
   *  @param  {Event} arg_event The event object
   *
   *  @return {undefined}
   */
  function onKeydown(arg_event)
  {
    /**
     *
     *
     *  Handle a keydown event, follow this format:
     *
     *  Space: Start the game and clear any visible messages
     *  Escape: Reset the game
     *  Left/Right: Move the platform by changing the tracking modifier
     */
     switch(arg_event.code){
       case 'Space':
         showMessage(null);
         reset();
         in_progress = true;
         doAnimate();
         break;
       case 'Escape':
         reset();
         break;
       case 'ArrowLeft':
         tracking.plat_x = -1;
         break;
       case 'ArrowRight':
         tracking.plat_x = 1;
         break;
       default:
         // nothing happens
     }
  }

  /**
   *  A keyup event was caught, handle it
   *
   *  @private
   *
   *  @param  {Event} arg_event The event object
   *
   *  @return {undefined}
   */
  function onKeyup(arg_event)
  {
    /**
     *
     *
     *  Handle a keyup event, follow this format:
     *
     *  Left/Right: Stop moving the platform
     */
     switch(arg_event.code){
       case 'ArrowLeft':
         tracking.plat_x = 0;
         break;
       case 'ArrowRight':
         tracking.plat_x = 0;
         break;
       default:
         // nothing happens
     }
  }

  /**
   *  This function is called each time a frame should be rendered
   *
   *  @private
   *
   *  @return {undefined}
   */
  function doAnimate()
  {
    /**
     *
     *  
     *  This function handles all animation
     *
     *  Be sure to:
     *    - If the platform is moving, position it
     *    - Position the ball based on the tracking and modifiers
     *    - Check for collisions using checkCollisions()
     *    - Check to see if there are no more bricks and either go to the next round or show a win message and start over
     */
     // If game is in progress only then process animation
     if(in_progress === true) {
       // position platform
       let xVelPlat = tracking.plat_x * modifiers.plat_x;
       positionPlatform(xVelPlat);
       // position ball
       let xVelBall = tracking.ball_x * modifiers.ball_x;
       let yVelBall = tracking.ball_y * modifiers.ball_y;
       positionBall(xVelBall, yVelBall);
       // check for collisions and handle them
       checkCollisions();
       // check to see if there are no more bricks
       let bricksPresent = bricks.some((brickRow) => {
         return brickRow.some((brick) => (brick.type > 0 && brick.type < 3));
       });
       // if no bricks are present then increment level and got to the next round
       // else display win message
       if(!bricksPresent){
         if(current_level < 2){
           current_level++;
           reset();
           showMessage('round_win');
         } else {
           current_level = 0;
           reset();
           showMessage('won');
         }
       }
       // request animation frame
       window.requestAnimationFrame(doAnimate);
     }
  }

  //########################################
  //Element Positioning
  //########################################

  /**
   *  Position the platform
   *
   *  @private
   *
   *  @param  {number} arg_position The positive or negative number to position the platform
   *                                If the value is positive, it moves the platform that many pixels to the right
   *                                If the value is negative, it moves the platform that many pixels to the left
   *                                If the value is not a number, it centers the platform
   *  @param  {boolean} arg_increment Defaults to true, increment the positions rather than setting
   *
   *  @return {undefined}
   */
  function positionPlatform(arg_position, arg_increment)
  {
    // get platform rectangle
    const platformRect = DOM.platform.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    // set initial position based on window width
    const initialPos = windowWidth/2 - platformRect.width/2;
    // set to initial or reposition or increment position based on params
    if(arg_position === undefined) DOM.platform.style.left = initialPos+'px';
    else if(arg_increment === false) DOM.platform.style.left = arg_position +'px';
    else DOM.platform.style.left = platformRect.left + arg_position +'px';
  }
  
  /**
   *  Position the ball
   *
   *  @private
   *
   *  @param  {number} arg_left The positive or negative number to position the ball horizontally
   *                            If the value is positive, it moves the ball that many pixels to the right horizontally
   *                            If the value is negative, it moves the ball that many pixels to the left horizontally
   *                            If the value is not a number, it centers the ball above the platform
   *  @param  {number} arg_top The positive or negative number to position the ball vertically
   *                           If the value is positive, it moves the ball that many pixels to the right vertically
   *                           If the value is negative, it moves the ball that many pixels to the left vertically
   *                           If the value is not a number, it centers the ball 20px above the platform
   *  @param  {boolean} arg_increment Defaults to true, increment the positions rather than setting
   *
   *  @return {undefined}
   */
  function positionBall(arg_left, arg_top, arg_increment)
  {
    // get ball and platform rectangles
    const platformRect = DOM.platform.getBoundingClientRect();
    const ballRect = DOM.ball.getBoundingClientRect();
    const ballSide = ballRect.width;
    const platformWidth = platformRect.width;
    // set initial position based on platform
    const initX = platformRect.left + platformWidth/2 - ballSide/2;
    const initY = platformRect.top - ballSide;
    // set to initial or reposition or increment position based on params
    if(arg_left === undefined && arg_top === undefined) {
      DOM.ball.style.left = initX+'px';
      DOM.ball.style.top = initY+'px';
    }
    else if(arg_increment === false) {
      DOM.ball.style.left = arg_left +'px';
      DOM.ball.style.top = arg_top +'px';
    }
    else {
      DOM.ball.style.left = ballRect.left + arg_left +'px';
      DOM.ball.style.top = ballRect.top - arg_top +'px';
    }
  }

  //########################################
  //Initialization
  //########################################

  //Listeners
  window.addEventListener('DOMContentLoaded', initialize, false);
  window.addEventListener('keydown', onKeydown, false);
  window.addEventListener('keyup', onKeyup, false);
};
