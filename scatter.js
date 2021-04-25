

// scatters the ray by adding a spherical random point
// this in-lines the random sphere and modifies the input ray to reduce overhead
function scatter(ray, spread = 1) {
	let angle = Math.random() * TWO_PI
	let z = 2 * Math.random() -1
	let radius = Math.cbrt(Math.random()) // makes distribution uniform     __
	ray.x += spread * radius * Math.sqrt(1 - z**2) * Math.cos(angle)   //  /  \
 	ray.y += spread * radius * Math.sqrt(1 - z**2) * Math.sin(angle)  //   \__/
	ray.z += spread * radius * z                                     //   sphere
	let length = Math.sqrt(ray.x**2 + ray.y**2 + ray.z**2) //    \ 
	if (length != 0) 									   //     }-- normalize
		ray.x /= length; ray.z /= length; ray.y /= length  //    /
}


// this is elegant for diffuse lighting        //        .` | `.
function diffuse_scatter(normal) {            //        /\  |  /\
	let jitter = random_sphere_surface()     //         |-\-+-/-|
	add(jitter, normal)                     //          `. \|/ .`
	return normalize(jitter)               //        _____`.V.`_____
} // naturally weights light 
  // based on angle of incidence                     cosine weighted


// this feels natural, but has some interesting feature which resemble drawn light more than realistic light. it has local hotpots, like truly reflective lighting, but these are angle invariant (not dependent on the viewing angle). this results in fairly concise drop shadows and unnaturally cohesive pockets of light on surfaces facing light sources. surprisingly useful.
function center_weighter_scatter(normal) { 
// note that this does not modify the ray, because it's passed ray data normals
	let angle = random_float(TWO_PI)
	let z = Math.random() * 2 - 1
	let ray = new Vector3( normal.x + Math.sqrt(1 - z**2) * Math.cos(angle), 
						   normal.y + Math.sqrt(1 - z**2) * Math.sin(angle),
						   normal.z + z );   // polar artifact causes center weighting
	let length = Math.sqrt(ray.x**2 + ray.y**2 + ray.z**2)
	if (length != 0)
		ray.x /= length; ray.z /= length; ray.y /= length // normalize
	return ray;
}


function hemispherical_scatter(ray) {
	// invert the backfacing half of a random sphere
	// this will always be in the upper hemisphere, and will be clustered fairly tightly around the core of the ray
	let jitter = random_sphere_surface();
	let shadow = dot(jitter, ray);
	if (shadow < 0) { // it's facing away
		// flip the component parallel to the ray, so it all ends up aligned
		add(jitter, make_scaled(ray, -2 * shadow));
	}
	return jitter; // already unit length
}

// based on a clean reflection, but with a scattered cone centered on the clean reflection vector. 0 is clean reflection, 1 is a (very center weighted) random hemisphere
function scattered_reflection_clustered(ray, normal, spread = 1) {
	let parallel_magnitude = dot(ray, normal)
	let reflected = copy_vector(ray)
	add(reflected, make_scaled(normal, -2 * parallel_magnitude));
	let jitter = random_sphere_surface();
	scale(jitter, spread * Math.random()); // this is going to be center weighted
	add(reflected, jitter);
	normalize(reflected);
	return reflected;
}

// version using uniform sphere instead of center weighted
function scattered_reflection_uniform(ray, normal, spread = 1) {
	let parallel_magnitude = dot(ray, normal)
	let reflected = copy_vector(ray)
	add(reflected, make_scaled(normal, -2 * parallel_magnitude))
	let jitter = random_sphere_volume();
	scale(jitter, parallel_magnitude * spread);
	add(reflected, jitter); //   |
	normalize(reflected);   // prevents self-intersection
	return reflected;       // 
}


// this ends up looking a lot like a hemisphere centered on the normal, and isn't as naturally tunable as the method above. 
function hemispherical_scattered_reflection(ray, normal) {
	let parallel_magnitude = dot(ray, normal)
	let reflected = copy_vector(ray)
	add(reflected, make_scaled(normal, -2 * parallel_magnitude));
	
	let jitter = random_sphere_surface();
	let shadow = dot(jitter, reflected);
	if (shadow < 0) { // it's facing away
		// flip the component parallel to the reflected ray, so it all ends up aligned
		add(jitter, make_scaled(reflected, -2 * shadow));
	}
	normalize(jitter);
	return jitter; // already unit length
}


// maybe we can use a method which does a random point in a circle, then aligns that so it's perpendicular to the reflection?

function test_scatter(callback) {
	let count = 10000;
	let output = new Vector3();
	let normal = new Vector3(0, -1, 0); //random_sphere_surface();
	for (let a = 0; a < count; a ++) {
		add(output, callback(normal));
	}
	return scale(output, 1 / count);
}
