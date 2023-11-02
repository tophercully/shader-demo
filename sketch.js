w= 1748
h = 2480
marg = 100

let shade;
function preload() {
  shade = loadShader("shader.vert", "shader.frag");
}
url = new URL(window.location.href)
urlParams = new URLSearchParams(url.search)
if(url.searchParams.has('size') == true) {
  pxSize = url.searchParams.get('size')
} else {
  url.searchParams.append('size', 1);
}
pxSize = url.searchParams.get('size')


//PARAMETERS
//shader passes, default 0 unless recursing
numPasses = 0



//pass features
$fx.features({
  "param1": 0,
  "param2": 0,
})

function setup() {
  createCanvas(w, h, WEBGL);
  if(pxSize == 1) {
    pixelDensity(1)
  } else if (pxSize == 2) {
    pixelDensity(2)
  } else if (pxSize == 3) {
    pixelDensity(3)
  }
  recur = createGraphics(w, h, WEBGL)
  p = createGraphics(w, h)
  c = createGraphics(w, h)
  b = createGraphics(w, h)
  g = createGraphics(w, h)
  angleMode(DEGREES)
  noLoop()
}

function draw() {
  p.background(0)
  c.background(0)
  b.background(0)

  //Sketch
  p.circle(w/2, h/2, h/2)



  

  //Post processing
   lastPass = false
   bgc = color(bgc)
   frameCol = color(frameCol)
   recur.shader(shade)
   shade.setUniform("u_resolution", [w, h]);
   shade.setUniform("pxSize", pxSize)
   shade.setUniform("p", p);
   shade.setUniform("g", g);
   shade.setUniform("c", c);
   shade.setUniform("seed", rv(0, 10));
   shade.setUniform("marg", map(marg, 0, w, 0, 1));
   shade.setUniform("lastPass", lastPass)
   shade.setUniform("bgc", [
     bgc.levels[0] / 255,
     bgc.levels[1] / 255,
     bgc.levels[2] / 255,
   ]);
   shade.setUniform("bgc", [
    frameCol.levels[0] / 255,
    frameCol.levels[1] / 255,
    frameCol.levels[2] / 255,
  ]);

   //recursive passes
   for(let i = 0; i < numPasses; i++) {
    if(i == 0) {
      firstPass = true
    } else {
      firstPass = false
    }

    shade.setUniform("firstPass", firstPass)
    shade.setUniform("p", p)
    recur.rect(0, 0, w, h)
    p.image(recur, 0, 0)
   }

   //final display pass
   lastPass = true
   shade.setUniform("lastPass", lastPass)
   shade.setUniform("p", p)
   recur.rect(0, 0, w, h)
   image(recur, -w/2, -h/2)

   //render preview
   $fx.preview()
}
