# metaballs-threeJS
Marching Cubes Algorithm using ThreeJS - Computer Graphics - UCLM

## Marching Cubes

Is known as a computer graphics algorithm for constructing a 3D polygonal mesh from a defined energy field in a continuous space.

The algorithm calculates the total energy value at each vertex of the grid(depending on the contribution of the fields) and then we study the vertices in pairs:

- If both vertices have a greater value than the threshold, they are inside the surface, so they are discarded.
- If both have a value lower than the threshold, they are outside the surface and also discarded.
- Otherwise if one has a value greater than the threshold and another has a value belows it, it means that this segment will contains a point of the new generated surface. 

Then we apply the linear interpolation to approximate the position of the vertex that has to be drawn. The resulting points will be connected and then we will have the resulting surface.

## Reading the JSON

To simplify this task, the json has been introduced as a variable in a javascript file.
You can check an example in [json_test](js/json_test.js)

**Important: json folder is just to have the examples in a more human readable way, but is not using directly into the code. Those jsons are passed to a js file in the form of a variable in order to be used by the program**

Then we just have to pass it as an argument to the function readjson in [scene](js/scene.js):

```js
//Reading of the JSON in a js file as a variable
            var data;
            function readjson(json)
            {
                data = JSON.parse(json);
                console.log("JSON:",data);
            }
```

If you want to use another example just check the variable name in the js that act as a json file and then in (index)(index.html), change to that variable name in the following piece of code:

```html
<script>
    //All of those functions have been defined on scene.js

    /*-------------------MAGIC HAPPENS HERE------------------*/
    readjson(json_test);
    init();
    setvalues();
    generateblobs();
    createobjects();
    marchingcubes();
    render();
    /*-------------------------------------------------------*/
</script>
```

## Executing the algorithm

In order to use the interactive aplication you just have to open the [index](index.html) file on your browser.

You have two main features to work with:
- Option panel
- Orbit controls

### Option panel

If you expand the **Scene Options** panel you may encounter with three new options: World, Objects and Blobs

By selecting one of these more options will be showing.
In the **World** part we have options to Show/Hide the _World grid_ and the _Gizmo_ and also change the size of both elements.
For the **Objects** part we have only one option which allows us to see the Initial object (before the algorithm is applied) or the Final result (after the algorithm is applied).
And finally the **Blobs** option will allows us to show or hide the energy fields as well as change its color to see the object better.

### Orbit Controls

You can rotate the camera using the left mouse button, move the camera using the right mouse button and even zoom in or zoom out using the mouse wheel.

These controls have been added to give a more interactive way of inspecting the objects through the created scene.

## Marching Cubes on ThreeJS

### Marching Cubes

As we have explained before, what we do is for every vertex of the geometry compute the energy value contributed by the fields.

```js
/* MARCHING CUBES ALGORITHM */
function marchingcubes()
{
    var values = [];
    var vector = [];

    for(vertex in geometry.vertices)
    {
        values.push(computeenergy(geometry.vertices[vertex]));
    }
                
    energies.push(values);
    console.log("Energy:",energies);

                
    for(vertex1 in geometry.vertices)
    {
        if(energies[0][vertex1] < threshold)
        {
            for(vertex2 in geometry.vertices)
            {
                if(energies[0][vertex2] > threshold)
                {                
                    vector.push(linearinterpolation(geometry.vertices[vertex1], geometry.vertices[vertex2], energies[0][vertex1], energies[0][vertex2]));
                }
            }
        }      
    }
```

The algorithm for computing the energy is the following:

```js
function computeenergy(point)
{
    var dist, fallOff;
    var energy = 0;

    for(blob in blobs)
    {
        dist = distance(point, blobs[blob].position);
        if(dist < blobs[blob].radius)
        {
            fallOff = 1 - (dist/blobs[blob].radius);
            energy += blobs[blob].energy * Math.pow(fallOff,2);
        }
    }
    return(parseFloat(energy.toFixed(2)));
}
```

And finally the linear interpolation algorithm that calculates the new points to be drawn:

```js
function linearinterpolation(point1, point2, energy1, energy2)
{
    var ratio = parseFloat(((threshold - energy1) / (energy2 - energy1)).toFixed(2));
    var v1 = new THREE.Vector3().copy(point1);
    var v2 = new THREE.Vector3().copy(point2);
    var vector = v2.sub(v1);
    (vector.multiplyScalar(ratio)).add(point1);

    return vector;
}
```

### Author and Acknowledgment
This code is a project developed by @Samuglz6 for the Computer Graphics course at the University of Castilla-La Mancha.