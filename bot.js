// This is a port of Ken Perlin's Java code. The
// original Java code is at http://cs.nyu.edu/%7Eperlin/noise/.
// Note that in this version, a number from 0 to 1 is returned.
PerlinNoise = new function() {

this.noise = function(x, y, z) {

   var p = new Array(512)
   var permutation = [ 151,160,137,91,90,15,
   131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
   190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
   88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
   77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
   102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
   135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
   5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
   223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
   129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
   251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
   49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
   138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
   ];
   for (var i=0; i < 256 ; i++) 
 p[256+i] = p[i] = permutation[i]; 

      var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
          Y = Math.floor(y) & 255,                  // CONTAINS POINT.
          Z = Math.floor(z) & 255;
      x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
      y -= Math.floor(y);                                // OF POINT IN CUBE.
      z -= Math.floor(z);
      var    u = fade(x),                                // COMPUTE FADE CURVES
             v = fade(y),                                // FOR EACH OF X,Y,Z.
             w = fade(z);
      var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
          B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,

      return scale(lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                     grad(p[BA  ], x-1, y  , z   )), // BLENDED
                             lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                     grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                     lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                     grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                             lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                     grad(p[BB+1], x-1, y-1, z-1 )))));
   }
   function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
   function lerp( t, a, b) { return a + t * (b - a); }
   function grad(hash, x, y, z) {
      var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
      var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
             v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
   } 
   function scale(n) { return (1 + n)/2; }
}


var Canvas = require('canvas');
var GIF = require('gifencoder');
var fs = require('fs');
var vm = require('vm');
var w = 506, h = 506;
var canvas = new Canvas(w,h);
var ctx = canvas.getContext('2d');
var usingT = false;
var frames = 90;

var creds = JSON.parse(fs.readFileSync('./creds.json'));

var Twitter = require('twitter');
var client = new Twitter(creds);


Array.prototype.random = function() {
    return this[Math.floor(Math.random()*this.length)];
}

var mod = function(x, y) {
    return x - y * Math.floor(x / y);
}

var rgb = function(r,g,b) {
    return ["rgb(",r,",",g,",",b,")"].join("");
}

var sigmoid = function(x) {
    return 2.0 / (1.0 + Math.exp(-2.0 * x)) - 1.0;
}

var sigmoidd = function(x)
{
    var s = sigmoid(x);
    return 1.0 - Math.pow(x,2.0);
}

var Dist = function(x1,y1,x2,y2)
{
    var xd = x1 - x2;
    var yd = y1 - y2;
    return Math.sqrt((xd*xd)+(yd+yd));
}

var Sign = function(x)
{
    return x < 0 ? -1 : 1;
}

var pixelExpr = '';

var grammar = {
    //'expr': function() { return ['Math.cos(expr)','Math.sin(expr)','expr-expr','expr*expr','expr+expr','expr%expr','Math.abs(expr)','Math.sqrt(expr)','Math.floor(expr)','Math.ceil(expr)','Math.max(expr,expr)','Math.min(expr,expr)','Math.atan2(expr,expr)','sigmoid(expr)','sigmoidd(expr)','Math.pow(expr,expr)','Math.exp(expr)', 'PerlinNoise.noise(expr,expr,expr)', 'Dist(expr,expr,expr,expr)', 'Sign(expr)'].random(); },
    'expr': function() { return ['radians(expr)', 'degrees(expr)', 'sin(expr)', 'cos(expr)', 'tan(expr)', 'asin(expr)', 'acos(expr)', 'atan(expr,expr)', 'atan(expr)', 'pow(expr,expr)', 'exp(expr)', 'log(expr)', 'exp2(expr)', 'log2(expr)', 'sqrt(expr)', 'inversesqrt(expr)', 'abs(expr)', 'floor(expr)', 'ceil(expr)', 'mod(expr, expr)', 'min(expr,expr)', 'max(expr,expr)', 'clamp(expr,expr,expr)', 'mix(expr,expr,expr)', 'step(expr,expr)', 'smoothstep(expr,expr,expr)']},
    'number': function() { return (10*Math.random()).toFixed(2) },
    'var': function() { 
        var result = ['x','y','t'].random(); 
        if(result == 't')
        {
            usingT = true;
        }
        return result;
    }
};

var translate = {
    'Math.cos': 'cos',
    'Math.sin': 'sin',
    'Math.abs': 'abs',
    'Math.sqrt': 'sqt',
    'Math.floor': 'flr',
    'Math.max': 'max',
    'Math.min': 'min',
    'Math.atan2': 'at2',
    'sigmoidd': 'sid',
    'sigmoid': 'sig',
    'Math.pow': 'pow',
    'Math.exp': 'exp',
    'Math.ceil': 'cel',
    'PerlinNoise.noise': 'pln',
    'Dist': 'dst',
    'Sign': 'sgn'
};

var doTranslate = function(str) {
  Object.keys(translate).forEach(function(key) {
    str = str.replace(new RegExp(key, 'g'), translate[key]);
  });
  return str;
}

var genExpr = function() {
    var str = 'expr';
    var len = 50;
    var iters = 0;
    while(doTranslate(str).length < len && iters < 50) {
        str = str.replace(/(expr)|(number)|(var)/g, function(repl) {
            return grammar[repl]();
        });
        iters++;
    }
    str = str.replace(/(expr)|(number)|(var)/g, function(repl) {
        if(Math.random() > 0.5) {
            return grammar['var']();
        } else {
            return grammar['number']();
        }
    });
    return str;
}



var allColors = [
    'rgb(0,0,0)',
'rgb(0,0,188)',
'rgb(0,0,252)',
'rgb(0,104,0)',
'rgb(0,120,0)',
'rgb(0,120,248)',
'rgb(0,136,136)',
'rgb(0,168,0)',
'rgb(0,168,68)',
'rgb(0,184,0)',
'rgb(0,232,216)',
'rgb(0,252,252)',
'rgb(0,64,88)',
'rgb(0,88,0)',
'rgb(0,88,248)',
'rgb(104,136,252)',
'rgb(104,68,252)',
'rgb(120,120,120)',
'rgb(124,124,124)',
'rgb(136,20,0)',
'rgb(148,0,132)',
'rgb(152,120,248)',
'rgb(164,228,252)',
'rgb(168,0,32)',
'rgb(168,16,0)',
'rgb(172,124,0)',
'rgb(184,184,248)',
'rgb(184,248,184)',
'rgb(184,248,216)',
'rgb(184,248,24)',
'rgb(188,188,188)',
'rgb(216,0,204)',
'rgb(216,184,248)',
'rgb(216,248,120)',
'rgb(228,0,88)',
'rgb(228,92,16)',
'rgb(240,208,176)',
'rgb(248,120,248)',
'rgb(248,120,88)',
'rgb(248,164,192)',
'rgb(248,184,0)',
'rgb(248,184,248)',
'rgb(248,216,120)',
'rgb(248,216,248)',
'rgb(248,248,248)',
'rgb(248,56,0)',
'rgb(248,88,152)',
'rgb(252,160,68)',
'rgb(252,224,168)',
'rgb(252,252,252)',
'rgb(60,188,252)',
'rgb(68,40,188)',
'rgb(80,48,0)',
'rgb(88,216,84)',
'rgb(88,248,152)'
];

var colorArrays = [
  [0,0,0],
[0,0,188],
[0,0,252],
[0,104,0],
[0,120,0],
[0,120,248],
[0,136,136],
[0,168,0],
[0,168,68],
[0,184,0],
[0,232,216],
[0,252,252],
[0,64,88],
[0,88,0],
[0,88,248],
[104,136,252],
[104,68,252],
[120,120,120],
[124,124,124],
[136,20,0],
[148,0,132],
[152,120,248],
[164,228,252],
[168,0,32],
[168,16,0],
[172,124,0],
[184,184,248],
[184,248,184],
[184,248,216],
[184,248,24],
[188,188,188],
[216,0,204],
[216,184,248],
[216,248,120],
[228,0,88],
[228,92,16],
[240,208,176],
[248,120,248],
[248,120,88],
[248,164,192],
[248,184,0],
[248,184,248],
[248,216,120],
[248,216,248],
[248,248,248],
[248,56,0],
[248,88,152],
[252,160,68],
[252,224,168],
[252,252,252],
[60,188,252],
[68,40,188],
[80,48,0],
[88,216,84],
[88,248,152]  
];

var findClosest = function(r,g,b) {
    var distance = 200000;
    var closest = 0;
    distance = Math.pow(colorArrays[0][0]-r,2) + Math.pow(colorArrays[0][1]-g,2) + Math.pow(colorArrays[0][2]-b,2);
    
    for(var i = 1; i < colors.length; ++i)
    {
        var d = Math.pow(colorArrays[i][0]-r,2) + Math.pow(colorArrays[i][1]-g,2) + Math.pow(colorArrays[i][2]-b,2);
        if(d < distance)
        {
            distance = d;
            closest = i;
        }
    }
    
    return colors[closest];
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var doTheThing = function() {

    var colors = allColors.slice(0);

    while(colors.length > 25)
    {
        colors.splice(Math.floor(Math.random()*colors.length),1);
    }

    colors = shuffle(colors);

    var encoder = new GIF(w, h);
    //encoder.createReadStream().pipe(fs.createWriteStream('test' + i + '.gif'));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(30);
    encoder.setQuality(10);

    var t, x, y;

    usingT = false;
    var rexpr = genExpr() + "+" + genExpr();
    while(usingT == false || doTranslate(rexpr).length > 116)
    {
        rexpr = genExpr() + "+" + genExpr();
        console.log(rexpr);
    }

    ctx.fillStyle = '#000';
    ctx.clearRect(0,0,w,h);
    
    var framesAdded = 0;

    for(v=0; v<frames; ++v) {
        t = Math.sin((2 * Math.PI) * (v / frames)) + 0.01;
        var lastColor = null;
        var multipleColors = false;
        for(xx=1; xx<w+1; xx+=2) {
            for(yy=1; yy<=h+1; yy+=2) {
                x = w / xx;
                y = h / yy;
                /*var r = Math.floor(((sigmoid(Math.abs(eval(rexpr)))+1)/2) * 255);
                var g = Math.floor(((sigmoid(Math.abs(eval(gexpr)))+1)/2) * 255);
                var b = Math.floor(((sigmoid(Math.abs(eval(bexpr)))+1)/2) * 255);*/
                ctx.fillStyle = colors[mod(Math.abs(Math.floor(eval(rexpr))), colors.length)];
                if(lastColor == null)
                {
                    lastColor = ctx.fillStyle;
                }
                else if( lastColor != ctx.fillStyle )
                {
                    multipleColors = true;
                }
                //ctx.fillStyle = findClosest(r,g,b);
                ctx.fillRect(xx-1, yy-1, 2, 2);
            }
        }
        
        // add 'scanlines'
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        for(y = 1; y < h; y += 2)
        {
            ctx.fillRect(0, y, w, 1);
        }
        
        if(multipleColors)
        {
            encoder.addFrame(ctx);
            ++framesAdded;
        }
    }

    encoder.finish();
    var buf = encoder.out.getData();
    fs.writeFileSync('output.gif', buf);
    var tweetText = doTranslate(rexpr);
    
    if(framesAdded==0)
    {
        doTheThing();
    }
    else
    {
        client.post('media/upload', {media: buf}, function(error, media, response) {
          if(!error) {
            var status = {
              status: tweetText,
              media_ids: media.media_id_string
            }

            client.post('statuses/update', status, function(error, tweet, response) {
              if(!error) {
                console.log(tweet);
              } else {
                console.log(error);
              }
            });
          } else {
            console.log(error);
          }
        });
        console.log(tweetText);
    }

}

doTheThing();
