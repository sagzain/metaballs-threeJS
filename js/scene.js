
            /*-------------------------------------------------------*/
            /*-----------------------VARIABLES-----------------------*/
            /*-------------------------------------------------------*/
            
            //We will create some arrays to store important variables/objects
            var blobs = []; //all created blobs are stored here
            var blob_meshes = [];
            var initial_objects = []; //created objects will be created here
            var final_objects = [];
            var energies = []; //calculated energies will be stored here

            //Grid and treshold
            var grid, threshold;

            //Scene variables
            var camera, scene, renderer;
            var geometry;

            //Control variables
            var transform, orbit;

            //Reading of the JSON in a js file as a variable
            var data;
            function readjson(json)
            {
                data = JSON.parse(json);
                console.log("JSON:",data);
            }
            
   
            /*-------------------------------------------------------*/
            /*-----------------------FUNCTIONS-----------------------*/
            /*-------------------------------------------------------*/

            /*Function that sets up the scene with the camera, render, mesh with material and geometry
              and also event controllers*/
            function init()
            {
                //Setting up the scene 
                scene = new THREE.Scene();

                //We will add also a GridHelper to see a grid on the screen
                scene.add(new THREE.GridHelper(10,10));

                //And a gizmo to show world's axis
                scene.add(new THREE.AxesHelper(4));

                //Setting up the camera to see the scene
                camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
                camera.position.set(5,3,10);
				
                //Renderer in charge of rendering the scene
                renderer = new THREE.WebGLRenderer({antialias: true});
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.body.appendChild(renderer.domElement);

                /*Orbit controller to control de camera
                  Controls are similar to blender:
                  - Left Click + Drag : Rotate the camera
                  - Right Click + Drag: Move the camera
                  - Shift + Left Click + Drag : Move the camera
                  - Shift + Right Click + Drag: Rotate the camera
                  - Middle Mouse + Drag: zoom in/zoom out*/
                orbit = new THREE.OrbitControls(camera,renderer.domElement);
                orbit.update();
                orbit.addEventListener('change', render);


                //EventListener to changes on the window size
                window.addEventListener('resize', onWindowResize, false);
            }

            function setvalues()
            {
                for(element in data)
                {
                    if(data[element].type == 'grid')
                    {
                        grid = data[element].value;
                        threshold = data[element].threshold;
                    }
                }
            }

            function generateblobs()
            {
                for(element in data)
                {
                    if (data[element].type == 'blob')
                    {
                        var position = new THREE.Vector3().fromArray(data[element].position);
                        var energy = data[element].energy;
                        var radius = data[element].radius;

                        var blob = new Blob(position, energy, radius);
                        blobs.push(blob);
                    }
                }

                for(blob in blobs)
                {
                    var material = new THREE.MeshBasicMaterial({color : 0xFF0000});
                    material.wireframe = true;
                    

                    var geometry = new THREE.SphereGeometry(blobs[blob].radius);


                    var blob_mesh = new THREE.Mesh(geometry,material);
                    blob_mesh.position.x = blobs[blob].position.x;
                    blob_mesh.position.y = blobs[blob].position.y;
                    blob_mesh.position.z = blobs[blob].position.z;
                    
                    blob_meshes.push(blob_mesh);
                }

                createblobs();
            }
            function createblobs()
            {
                for(blob in blob_meshes)
                {
                    blob_meshes[blob].name = "blob"+blob;
                    scene.add(blob_meshes[blob]);
                }
            }

            function createobjects()
            {
                var material = new THREE.MeshBasicMaterial();
                material.side = THREE.DoubleSide;
                material.visible = false;

                geometry = new THREE.Geometry();

                for(element in data)
                {
                    if(data[element].type == 'object')
                    {
                        generatevertices();
                        generatefaces();

                        var mesh = new THREE.Mesh(geometry, material);
                        initial_objects.push(mesh);
                        scene.add(mesh);
                    }
                }
            }
            /*Function called when EventListener detects changes on the window size
              It updates the scene to the current window size and renders it again*/
            function onWindowResize()
            {
                const aspect = window.innerWidth / window.innerHeight;

                camera.aspect = aspect;
                camera.updateProjectionMatrix();

                renderer.setSize(window.innerWidth, window.innerHeight);

                render();
            }
            
            //Function that renders the scene with its elements and the camera.
            function render(){
                renderer.render(scene,camera);
            }

            function generatevertices()
            {
                //Store in the geometry variable, the vertices that we have defined on the json file.
                for(vertex in data[element].vertices)
                {
                    geometry.vertices.push(new THREE.Vector3().fromArray(data[element].vertices[vertex]));
                }
            }

            /*Function to generate automatical faces given a set of vertices*/
            function generatefaces()
            {
                for(face in data[element].faces)
                {
                    geometry.faces.push(new THREE.Face3(data[element].faces[face][0],data[element].faces[face][1],data[element].faces[face][2]))
                }
            }

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

                console.log("New points:",vector);

                var finalgeometry = geometry.clone();
                var material = new THREE.MeshBasicMaterial();
                material.side = THREE.DoubleSide;

                var finalmesh = new THREE.Mesh(finalgeometry, material);
                finalgeometry.vertices = vector;

                final_objects.push(finalmesh);

                scene.add(finalmesh);
            }
            
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

            function distance(point1, point2)
            {
                return point1.distanceTo(point2);
            }

            function linearinterpolation(point1, point2, energy1, energy2)
            {
                var ratio = parseFloat(((threshold - energy1) / (energy2 - energy1)).toFixed(2));
                var v1 = new THREE.Vector3().copy(point1);
                var v2 = new THREE.Vector3().copy(point2);
                var vector = v2.sub(v1);
                (vector.multiplyScalar(ratio)).add(point1);

                return vector;
            }

            function change_world_grid(checkbox)
            {
                if(checkbox.checked)
                {
                    document.getElementById("grid_size").disabled = false;
                    document.getElementById("grid_size").style.backgroundColor = 'white';
                    for(element in scene.children)
                        if(scene.children[element].type == 'GridHelper')
                            scene.getObjectById(scene.children[element].id).visible = true;

                }
                else
                {
                    document.getElementById("grid_size").disabled = true;
                    document.getElementById("grid_size").style.backgroundColor = 'lightgray';
                    for(element in scene.children)
                        if(scene.children[element].type == 'GridHelper')
                            scene.getObjectById(scene.children[element].id).visible = false;
                }

                render();
            }

            function change_blob_field(checkbox)
            {
                for(blob in blob_meshes)
                {
                    if(checkbox.checked)
                    {      
                        document.getElementById("colors").disabled = false;
                        document.getElementById("colors").style.backgroundColor = 'white';

                        scene.getObjectByName(blob_meshes[blob].name).material.visible = true;
                    }
                    else
                    {
                        document.getElementById("colors").style.backgroundColor = 'lightgray';
                        document.getElementById("colors").disabled = true;
                        
                        scene.getObjectByName(blob_meshes[blob].name).material.visible = false;
                    }
                }
                    render();
            }

            function change_field_color(selectionbox)
            {
                for(blob in blob_meshes)
                {
                    switch(selectionbox)
                    {
                        case 'red':
                            scene.getObjectByName(blob_meshes[blob].name).material.color.set(0xFF0000);
                            break;
                        case 'blue':
                            (scene.getObjectByName(blob_meshes[blob].name).material).color.set(0x0000FF);
                            break;
                        case 'purple':
                            scene.getObjectByName(blob_meshes[blob].name).material.color.set(0x800080);
                            break;
                        case 'green':
                            scene.getObjectByName(blob_meshes[blob].name).material.color.set(0x008000);
                            break;
                        case 'yellow':
                            scene.getObjectByName(blob_meshes[blob].name).material.color.set(0xFFFF00);
                            break;
                        case 'aqua':
                            scene.getObjectByName(blob_meshes[blob].name).material.color.set(0x00FFFF);
                            break;
                    }

                }

                render();
            }

            function change_object_display(selectionbox)
            {
                switch(selectionbox)
                {
                    case 'initial_object':
                            for(object in initial_objects)
                            {
                                initial_objects[object].material.visible = true;
                            }

                            for(object in final_objects)
                            {
                                final_objects[object].material.visible = false;
                            }
                        break;
                    case 'final_object':
                            for(object in initial_objects)
                            {
                                initial_objects[object].material.visible = false;
                            }

                            for(object in final_objects)
                            {
                                final_objects[object].material.visible = true;
                            }
                        break;
                }
                render();
            }

            function change_world_gizmo(checkbox)
            {
                if(checkbox.checked)
                {
                    document.getElementById("gizmo_size").disabled = false;
                    document.getElementById("gizmo_size").style.backgroundColor = 'white';
                    for(element in scene.children)
                        if(scene.children[element].type == 'AxesHelper')
                            scene.getObjectById(scene.children[element].id).visible = true;
                

                }
                else
                {
                    document.getElementById("gizmo_size").disabled = true;
                    document.getElementById("gizmo_size").style.backgroundColor = 'lightgray';
                    for(element in scene.children)
                        if(scene.children[element].type == 'AxesHelper')
                            scene.getObjectById(scene.children[element].id).visible = false;
                
                }

                render();
            }

            function change_grid_size(checkbox)
            {
                for(element in scene.children)
                    if(scene.children[element].type == 'GridHelper')
                        scene.remove(scene.getObjectById(scene.children[element].id));
                
                scene.add(new THREE.GridHelper(checkbox,checkbox));
    
                render();
            }

            function change_gizmo_size(checkbox)
            {
                for(element in scene.children)
                    if(scene.children[element].type == 'AxesHelper')
                        scene.remove(scene.getObjectById(scene.children[element].id));
                
                scene.add(new THREE.AxesHelper(checkbox));
    
                render();
            }