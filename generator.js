basicFunctions = ["expr+expr", "expr-expr", "expr*expr"];

logicFunctions = ["mif(expr,expr,expr)", "mand(expr,expr)", "mor(expr,expr)"] // mif, mand, mor - I like these terms (short for my)

angleAndTrigFunctions = ["radians(expr)", "degrees(expr)", "sin(expr)", "cos(expr)", "tan(expr)",
    "asin(clamp(expr,-1.0,1.0))", "acos(clamp(expr,-1.0,1.0))", "atan(expr)", "satan(expr,expr)"]; // atan(expr,expr) undefined result if both 0

exponentialFunctions = ["pow(abs(expr), minp(expr))", // argh
    "exp(expr)", "log(minp(expr))", "exp2(expr)", "log2(minp(expr))", "sqrt(abs(expr))",
    "inversesqrt(minp(expr))"];

commonFunctions = ["abs(expr)", "sign(expr)", "floor(expr)", "ceil(expr)", "fract(expr)",
    "mod(expr,expr)", "min(expr,expr)", "max(expr,expr)", "sclamp(expr,expr,expr)",
    "mix(expr,expr,expr)", "step(expr,expr)", "ssmoothstep(expr,expr,expr)"];

geometricFunctions = ["length(vec2(expr,expr))", "distance(vec2(expr,expr),vec2(expr,expr))",
    "dot(vec2(expr,expr),vec2(expr,expr))"]; // @todo: cross, normalize, faceforward, reflect, refract

// from https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
// can always add more
signedDistanceFunctions = ["sdSphere(vec3(expr,expr,expr),expr)", "sdBox(vec3(expr,expr,expr),expr)",
    "sdRoundBox(vec3(expr,expr,expr),vec3(expr,expr,expr),expr)", "sdTorus(vec3(expr,expr,expr),vec2(expr,expr))",
    "sdCappedTorus(vec3(expr,expr,expr),vec2(expr,expr),expr,expr)",
    "sdLink(vec3(expr,expr,expr), expr, expr, expr)",
    "sdCylinder(vec3(expr,expr,expr),vec3(expr,expr,expr))",
    "sdCone(vec3(expr,expr,expr),vec2(expr,expr))",
    "sdPlane(vec3(expr,expr,expr),vec4(expr,expr,expr,expr))",
    "sdHexPrism(vec3(expr,expr,expr),vec2(expr,expr))",
    "sdTriPrism(vec3(expr,expr,expr),vec2(expr,expr))",
    "sdCapsule(vec3(expr,expr,expr),vec3(expr,expr,expr),vec3(expr,expr,expr),expr)",
    "sdVerticalCapsule(vec3(expr,expr,expr),expr,expr)",
    "sdCappedCylinder(vec3(expr,expr,expr),expr,expr)",
    "sdRoundedCylinder(vec3(expr,expr,expr),expr,expr,expr)",
    "sdCappedCone(vec3(expr,expr,expr),expr,expr,expr)",
    "sdSolidAngle(vec3(expr,expr,expr), vec2(expr,expr), expr)",
    "sdRoundCone(vec3(expr,expr,expr),expr,expr,expr)",
    "sdEllipsoid(vec3(expr,expr,expr),vec3(expr,expr,expr))",
    "sdOctahedron(vec3(expr,expr,expr),expr)",
    "sdAxisAlignedRect(vec2(expr,expr),vec2(expr,expr),vec2(expr,expr))",
    "sdLineSegment(vec2(expr,expr),vec2(expr,expr),vec2(expr,expr),expr)"];

// from https://www.shadertoy.com/view/WdtXWn
stolenFunctionsA = ["hash12(vec2(expr,expr))", "Hash(vec3(expr,expr,expr))",
    "Noise3d(vec3(expr,expr,expr))", "pModPolar(vec2(expr,expr),expr)", "fOpUnionRound(expr,expr,expr)",
    "smoothAdd(expr,expr,expr)",
    "pyramid(vec3(expr,expr,expr),expr)", "snoise(vec3(expr,expr,expr))",
    "rand(vec2(expr,expr))", "gaussrand(vec2(expr,expr), vec3(expr,expr,expr), expr, expr)"]

samplingFunctions = ["sR(expr,expr)", "sG(expr,expr)", "sB(expr,expr)"]

// @todo: sample from previous frame for CAs, etc.
// miscFunctions = [ "sR()", "sG()", "sB()",                        // sample previous frame @ this position
//    "sR(expr,expr)", "sG(expr,expr)", "sB(expr,expr)",          // sample previous frame @ x, y position
//    "sRO(expr,expr))", "sGO(expr,expr)", "sBO(expr,expr)"];     // sample previous frame @ this position + offset

allFunctions = basicFunctions.concat(basicFunctions, angleAndTrigFunctions, exponentialFunctions, commonFunctions, geometricFunctions, signedDistanceFunctions, stolenFunctionsA, samplingFunctions);

allFunctions.push("sR(expr,expr)");

console.log(allFunctions);

var grammar = {
    "expr": function() { return allFunctions.random(); },
    'number': function() { return (10*Math.random()).toFixed(2) },
    'var': function() {
        var result = ['x','y','t'].random();
        if(Math.random() < 0.001)
            result = ['lR()','lG()','lB()'].random();

        if(result == 't')
        {
            usingT = true;
        }

        return result;
    }
};

var genExpr = function() {
    var str = 'expr';
    var len = complexity;
    var iters = 0;
    while(str.length < len && iters < 50) {
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