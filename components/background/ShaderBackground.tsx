/\* eslint-disable \*/
/\*
 \*   Stripe WebGl Gradient Animation
 \*   All Credits to Stripe.com
 \*   ScrollObserver functionality to disable animation when not scrolled into view has been disabled and
 \*   commented out for now.
 \*   [https://kevinhufnagl.com](https://kevinhufnagl.com)
 \*/

//Converting colors to proper format
function normalizeColor(hexCode) {
&#x9;return [
&#x9;	((hexCode >> 16) & 255) / 255,
&#x9;	((hexCode >> 8) & 255) / 255,
&#x9;	(255 & hexCode) / 255,
&#x9;];
}
["SCREEN", "LINEAR_LIGHT"].reduce(
&#x9;(hexCode, t, n) =>
&#x9;	Object.assign(hexCode, {
&#x9;		[t]: n,
&#x9;	}),
&#x9;{}
);

//Essential functionality of WebGl
//t = width
//n = height
class MiniGl {
&#x9;constructor(canvas, width, height, debug = false) {
&#x9;	const \_miniGl = this,
&#x9;		debug_output =
&#x9;			-1 !== document.location.search.toLowerCase().indexOf("debug=webgl");
&#x9;	(\_miniGl.canvas = canvas),
&#x9;		(\_miniGl.gl = \_miniGl.canvas.getContext("webgl", {
&#x9;			antialias: true,
&#x9;		})),
&#x9;		(\_miniGl.meshes = []);
&#x9;	const context = \_miniGl.gl;
&#x9;	width && height && this.setSize(width, height),
&#x9;		\_miniGl.lastDebugMsg,
&#x9;		(\_miniGl.debug =
&#x9;			debug && debug_output
&#x9;				? function (e) {
&#x9;						const t = new Date();
&#x9;						t - \_miniGl.lastDebugMsg > 1e3 && console.log("---"),
&#x9;							console.log(
&#x9;								t.toLocaleTimeString() +
&#x9;									Array(Math.max(0, 32 - e.length)).join(" ") +
&#x9;									e +
&#x9;									": ",
&#x9;								...Array.from(arguments).slice(1)
&#x9;							),
&#x9;							(\_miniGl.lastDebugMsg = t);
&#x9;				  }
&#x9;				: () => {}),
&#x9;		Object.defineProperties(\_miniGl, {
&#x9;			Material: {
&#x9;				enumerable: false,
&#x9;				value: class {
&#x9;					constructor(vertexShaders, fragments, uniforms = {}) {
&#x9;						const material = this;
&#x9;						function getShaderByType(type, source) {
&#x9;							const shader = context.createShader(type);
&#x9;							return (
&#x9;								context.shaderSource(shader, source),
&#x9;								context.compileShader(shader),
&#x9;								context.getShaderParameter(shader, context.COMPILE_STATUS) ||
&#x9;									console.error(context.getShaderInfoLog(shader)),
&#x9;								\_miniGl.debug("Material.compileShaderSource", {
&#x9;									source: source,
&#x9;								}),
&#x9;								shader
&#x9;							);
&#x9;						}
&#x9;						function getUniformVariableDeclarations(uniforms, type) {
&#x9;							return Object.entries(uniforms)
&#x9;								.map(([uniform, value]) =>
&#x9;									value.getDeclaration(uniform, type)
&#x9;								)
&#x9;								.join("\n");
&#x9;						}
&#x9;						(material.uniforms = uniforms), (material.uniformInstances = []);

&#x9;						const prefix =
&#x9;							"\n              precision highp float;\n            ";
&#x9;						(material.vertexSource = \`\n              ${prefix}\n              attribute vec4 position;\n              attribute vec2 uv;\n              attribute vec2 uvNorm;\n              ${getUniformVariableDeclarations(
&#x9;							\_miniGl.commonUniforms,
&#x9;							"vertex"
&#x9;						)}\n              ${getUniformVariableDeclarations(
&#x9;							uniforms,
&#x9;							"vertex"
&#x9;						)}\n              ${vertexShaders}\n            \`),
&#x9;							(material.Source = \`\n              ${prefix}\n              ${getUniformVariableDeclarations(
&#x9;								\_miniGl.commonUniforms,
&#x9;								"fragment"
&#x9;							)}\n              ${getUniformVariableDeclarations(
&#x9;								uniforms,
&#x9;								"fragment"
&#x9;							)}\n              ${fragments}\n            \`),
&#x9;							(material.vertexShader = getShaderByType(
&#x9;								context.VERTEX_SHADER,
&#x9;								material.vertexSource
&#x9;							)),
&#x9;							(material.fragmentShader = getShaderByType(
&#x9;								context.FRAGMENT_SHADER,
&#x9;								material.Source
&#x9;							)),
&#x9;							(material.program = context.createProgram()),
&#x9;							context.attachShader(material.program, material.vertexShader),
&#x9;							context.attachShader(material.program, material.fragmentShader),
&#x9;							context.linkProgram(material.program),
&#x9;							context.getProgramParameter(
&#x9;								material.program,
&#x9;								context.LINK_STATUS
&#x9;							) || console.error(context.getProgramInfoLog(material.program)),
&#x9;							context.useProgram(material.program),
&#x9;							material.attachUniforms(void 0, \_miniGl.commonUniforms),
&#x9;							material.attachUniforms(void 0, material.uniforms);
&#x9;					}
&#x9;					//t = uniform
&#x9;					attachUniforms(name, uniforms) {
&#x9;						//n  = material
&#x9;						const material = this;
&#x9;						void 0 === name
&#x9;							? Object.entries(uniforms).forEach(([name, uniform]) => {
&#x9;									material.attachUniforms(name, uniform);
&#x9;							  })
&#x9;							: "array" == uniforms.type
&#x9;							? uniforms.value.forEach((uniform, i) =>
&#x9;									material.attachUniforms(\`${name}[${i}]\`, uniform)
&#x9;							  )
&#x9;							: "struct" == uniforms.type
&#x9;							? Object.entries(uniforms.value).forEach(([uniform, i]) =>
&#x9;									material.attachUniforms(\`${name}.${uniform}\`, i)
&#x9;							  )
&#x9;							: (\_miniGl.debug("Material.attachUniforms", {
&#x9;									name: name,
&#x9;									uniform: uniforms,
&#x9;							  }),
&#x9;							  material.uniformInstances.push({
&#x9;									uniform: uniforms,
&#x9;									location: context.getUniformLocation(
&#x9;										material.program,
&#x9;										name
&#x9;									),
&#x9;							  }));
&#x9;					}
&#x9;				},
&#x9;			},
&#x9;			Uniform: {
&#x9;				enumerable: !1,
&#x9;				value: class {
&#x9;					constructor(e) {
&#x9;						(this.type = "float"), Object.assign(this, e);
&#x9;						(this.typeFn =
&#x9;							{
&#x9;								float: "1f",
&#x9;								int: "1i",
&#x9;								vec2: "2fv",
&#x9;								vec3: "3fv",
&#x9;								vec4: "4fv",
&#x9;								mat4: "Matrix4fv",
&#x9;							}[this.type] || "1f"),
&#x9;							this.update();
&#x9;					}
&#x9;					update(value) {
&#x9;						void 0 !== this.value &&
&#x9;							context[\`uniform${this.typeFn}\`]\(
&#x9;								value,
&#x9;								0 === this.typeFn.indexOf("Matrix")
&#x9;									? this.transpose
&#x9;									: this.value,
&#x9;								0 === this.typeFn.indexOf("Matrix") ? this.value : null
&#x9;							);
&#x9;					}
&#x9;					//e - name
&#x9;					//t - type
&#x9;					//n - length
&#x9;					getDeclaration(name, type, length) {
&#x9;						const uniform = this;
&#x9;						if (uniform.excludeFrom !== type) {
&#x9;							if ("array" === uniform.type)
&#x9;								return (
&#x9;									uniform.value[0].getDeclaration(
&#x9;										name,
&#x9;										type,
&#x9;										uniform.value.length
&#x9;									) + \`\nconst int ${name}\_length = ${uniform.value.length};\`
&#x9;								);
&#x9;							if ("struct" === uniform.type) {
&#x9;								let name_no_prefix = name.replace("u\_", "");
&#x9;								return (
&#x9;									(name_no_prefix =
&#x9;										name_no_prefix.charAt(0).toUpperCase() +
&#x9;										name_no_prefix.slice(1)),
&#x9;									\`uniform struct ${name_no_prefix} 
                                  {\n\` +
&#x9;										Object.entries(uniform.value)
&#x9;											.map(([name, uniform]) =>
&#x9;												uniform
&#x9;													.getDeclaration(name, type)
&#x9;													.replace(/^uniform/, "")
&#x9;											)
&#x9;											.join("") +
&#x9;										\`\n} ${name}${length > 0 ? \`[${length}]\` : ""};\`
&#x9;								);
&#x9;							}
&#x9;							return \`uniform ${uniform.type} ${name}${
&#x9;								length > 0 ? \`[${length}]\` : ""
&#x9;							};\`;
&#x9;						}
&#x9;					}
&#x9;				},
&#x9;			},
&#x9;			PlaneGeometry: {
&#x9;				enumerable: !1,
&#x9;				value: class {
&#x9;					constructor(width, height, n, i, orientation) {
&#x9;						context.createBuffer(),
&#x9;							(this.attributes = {
&#x9;								position: new \_miniGl.Attribute({
&#x9;									target: context.ARRAY_BUFFER,
&#x9;									size: 3,
&#x9;								}),
&#x9;								uv: new \_miniGl.Attribute({
&#x9;									target: context.ARRAY_BUFFER,
&#x9;									size: 2,
&#x9;								}),
&#x9;								uvNorm: new \_miniGl.Attribute({
&#x9;									target: context.ARRAY_BUFFER,
&#x9;									size: 2,
&#x9;								}),
&#x9;								index: new \_miniGl.Attribute({
&#x9;									target: context.ELEMENT_ARRAY_BUFFER,
&#x9;									size: 3,
&#x9;									type: context.UNSIGNED_SHORT,
&#x9;								}),
&#x9;							}),
&#x9;							this.setTopology(n, i),
&#x9;							this.setSize(width, height, orientation);
&#x9;					}
&#x9;					setTopology(e = 1, t = 1) {
&#x9;						const n = this;
&#x9;						(n.xSegCount = e),
&#x9;							(n.ySegCount = t),
&#x9;							(n.vertexCount = (n.xSegCount + 1) \* (n.ySegCount + 1)),
&#x9;							(n.quadCount = n.xSegCount \* n.ySegCount \* 2),
&#x9;							(n.attributes.uv.values = new Float32Array(2 \* n.vertexCount)),
&#x9;							(n.attributes.uvNorm.values = new Float32Array(
&#x9;								2 \* n.vertexCount
&#x9;							)),
&#x9;							(n.attributes.index.values = new Uint16Array(3 \* n.quadCount));
&#x9;						for (let e = 0; e <= n.ySegCount; e++)
&#x9;							for (let t = 0; t <= n.xSegCount; t++) {
&#x9;								const i = e \* (n.xSegCount + 1) + t;
&#x9;								if (
&#x9;									((n.attributes.uv.values[2 \* i] = t / n.xSegCount),
&#x9;									(n.attributes.uv.values[2 \* i + 1] = 1 - e / n.ySegCount),
&#x9;									(n.attributes.uvNorm.values[2 \* i] =
&#x9;										(t / n.xSegCount) \* 2 - 1),
&#x9;									(n.attributes.uvNorm.values[2 \* i + 1] =
&#x9;										1 - (e / n.ySegCount) \* 2),
&#x9;									t < n.xSegCount && e < n.ySegCount)
&#x9;								) {
&#x9;									const s = e \* n.xSegCount + t;
&#x9;									(n.attributes.index.values[6 \* s] = i),
&#x9;										(n.attributes.index.values[6 \* s + 1] =
&#x9;											i + 1 + n.xSegCount),
&#x9;										(n.attributes.index.values[6 \* s + 2] = i + 1),
&#x9;										(n.attributes.index.values[6 \* s + 3] = i + 1),
&#x9;										(n.attributes.index.values[6 \* s + 4] =
&#x9;											i + 1 + n.xSegCount),
&#x9;										(n.attributes.index.values[6 \* s + 5] =
&#x9;											i + 2 + n.xSegCount);
&#x9;								}
&#x9;							}
&#x9;						n.attributes.uv.update(),
&#x9;							n.attributes.uvNorm.update(),
&#x9;							n.attributes.index.update(),
&#x9;							\_miniGl.debug("Geometry.setTopology", {
&#x9;								uv: n.attributes.uv,
&#x9;								uvNorm: n.attributes.uvNorm,
&#x9;								index: n.attributes.index,
&#x9;							});
&#x9;					}
&#x9;					setSize(width = 1, height = 1, orientation = "xz") {
&#x9;						const geometry = this;
&#x9;						(geometry.width = width),
&#x9;							(geometry.height = height),
&#x9;							(geometry.orientation = orientation),
&#x9;							(geometry.attributes.position.values &&
&#x9;								geometry.attributes.position.values.length ===
&#x9;									3 \* geometry.vertexCount) ||
&#x9;								(geometry.attributes.position.values = new Float32Array(
&#x9;									3 \* geometry.vertexCount
&#x9;								));
&#x9;						const o = width / -2,
&#x9;							r = height / -2,
&#x9;							segment_width = width / geometry.xSegCount,
&#x9;							segment_height = height / geometry.ySegCount;
&#x9;						for (let yIndex = 0; yIndex <= geometry.ySegCount; yIndex++) {
&#x9;							const t = r + yIndex \* segment_height;
&#x9;							for (let xIndex = 0; xIndex <= geometry.xSegCount; xIndex++) {
&#x9;								const r = o + xIndex \* segment_width,
&#x9;									l = yIndex \* (geometry.xSegCount + 1) + xIndex;
&#x9;								(geometry.attributes.position.values[
&#x9;									3 \* l + "xyz".indexOf(orientation[0])
&#x9;								] = r),
&#x9;									(geometry.attributes.position.values[
&#x9;										3 \* l + "xyz".indexOf(orientation[1])
&#x9;									] = -t);
&#x9;							}
&#x9;						}
&#x9;						geometry.attributes.position.update(),
&#x9;							\_miniGl.debug("Geometry.setSize", {
&#x9;								position: geometry.attributes.position,
&#x9;							});
&#x9;					}
&#x9;				},
&#x9;			},
&#x9;			Mesh: {
&#x9;				enumerable: !1,
&#x9;				value: class {
&#x9;					constructor(geometry, material) {
&#x9;						const mesh = this;
&#x9;						(mesh.geometry = geometry),
&#x9;							(mesh.material = material),
&#x9;							(mesh.wireframe = !1),
&#x9;							(mesh.attributeInstances = []),
&#x9;							Object.entries(mesh.geometry.attributes).forEach(
&#x9;								([e, attribute]) => {
&#x9;									mesh.attributeInstances.push({
&#x9;										attribute: attribute,
&#x9;										location: attribute.attach(e, mesh.material.program),
&#x9;									});
&#x9;								}
&#x9;							),
&#x9;							\_miniGl.meshes.push(mesh),
&#x9;							\_miniGl.debug("Mesh.constructor", {
&#x9;								mesh: mesh,
&#x9;							});
&#x9;					}
&#x9;					draw() {
&#x9;						context.useProgram(this.material.program),
&#x9;							this.material.uniformInstances.forEach(
&#x9;								({ uniform: e, location: t }) => e.update(t)
&#x9;							),
&#x9;							this.attributeInstances.forEach(
&#x9;								({ attribute: e, location: t }) => e.use(t)
&#x9;							),
&#x9;							context.drawElements(
&#x9;								this.wireframe ? context.LINES : context.TRIANGLES,
&#x9;								this.geometry.attributes.index.values.length,
&#x9;								context.UNSIGNED_SHORT,
&#x9;								0
&#x9;							);
&#x9;					}
&#x9;					remove() {
&#x9;						\_miniGl.meshes = \_miniGl.meshes.filter((e) => e != this);
&#x9;					}
&#x9;				},
&#x9;			},
&#x9;			Attribute: {
&#x9;				enumerable: !1,
&#x9;				value: class {
&#x9;					constructor(e) {
&#x9;						(this.type = context.FLOAT),
&#x9;							(this.normalized = !1),
&#x9;							(this.buffer = context.createBuffer()),
&#x9;							Object.assign(this, e),
&#x9;							this.update();
&#x9;					}
&#x9;					update() {
&#x9;						void 0 !== this.values &&
&#x9;							(context.bindBuffer(this.target, this.buffer),
&#x9;							context.bufferData(
&#x9;								this.target,
&#x9;								this.values,
&#x9;								context.STATIC_DRAW
&#x9;							));
&#x9;					}
&#x9;					attach(e, t) {
&#x9;						const n = context.getAttribLocation(t, e);
&#x9;						return (
&#x9;							this.target === context.ARRAY_BUFFER &&
&#x9;								(context.enableVertexAttribArray(n),
&#x9;								context.vertexAttribPointer(
&#x9;									n,
&#x9;									this.size,
&#x9;									this.type,
&#x9;									this.normalized,
&#x9;									0,
&#x9;									0
&#x9;								)),
&#x9;							n
&#x9;						);
&#x9;					}
&#x9;					use(e) {
&#x9;						context.bindBuffer(this.target, this.buffer),
&#x9;							this.target === context.ARRAY_BUFFER &&
&#x9;								(context.enableVertexAttribArray(e),
&#x9;								context.vertexAttribPointer(
&#x9;									e,
&#x9;									this.size,
&#x9;									this.type,
&#x9;									this.normalized,
&#x9;									0,
&#x9;									0
&#x9;								));
&#x9;					}
&#x9;				},
&#x9;			},
&#x9;		});
&#x9;	const a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
&#x9;	\_miniGl.commonUniforms = {
&#x9;		projectionMatrix: new \_miniGl.Uniform({
&#x9;			type: "mat4",
&#x9;			value: a,
&#x9;		}),
&#x9;		modelViewMatrix: new \_miniGl.Uniform({
&#x9;			type: "mat4",
&#x9;			value: a,
&#x9;		}),
&#x9;		resolution: new \_miniGl.Uniform({
&#x9;			type: "vec2",
&#x9;			value: [1, 1],
&#x9;		}),
&#x9;		aspectRatio: new \_miniGl.Uniform({
&#x9;			type: "float",
&#x9;			value: 1,
&#x9;		}),
&#x9;	};
&#x9;}
&#x9;setSize(e = 640, t = 480) {
&#x9;	(this.width = e),
&#x9;		(this.height = t),
&#x9;		(this.canvas.width = e),
&#x9;		(this.canvas.height = t),
&#x9;		this.gl.viewport(0, 0, e, t),
&#x9;		(this.commonUniforms.resolution.value = [e, t]),
&#x9;		(this.commonUniforms.aspectRatio.value = e / t),
&#x9;		this.debug("MiniGL.setSize", {
&#x9;			width: e,
&#x9;			height: t,
&#x9;		});
&#x9;}
&#x9;//left, right, top, bottom, near, far
&#x9;setOrthographicCamera(e = 0, t = 0, n = 0, i = -2e3, s = 2e3) {
&#x9;	(this.commonUniforms.projectionMatrix.value = [
&#x9;		2 / this.width,
&#x9;		0,
&#x9;		0,
&#x9;		0,
&#x9;		0,
&#x9;		2 / this.height,
&#x9;		0,
&#x9;		0,
&#x9;		0,
&#x9;		0,
&#x9;		2 / (i - s),
&#x9;		0,
&#x9;		e,
&#x9;		t,
&#x9;		n,
&#x9;		1,
&#x9;	]),
&#x9;		this.debug(
&#x9;			"setOrthographicCamera",
&#x9;			this.commonUniforms.projectionMatrix.value
&#x9;		);
&#x9;}
&#x9;render() {
&#x9;	this.gl.clearColor(0, 0, 0, 0),
&#x9;		this.gl.clearDepth(1),
&#x9;		this.meshes.forEach((e) => e.draw());
&#x9;}
}

//Sets initial properties
function e(object, propertyName, val) {
&#x9;return (
&#x9;	propertyName in object
&#x9;		? Object.defineProperty(object, propertyName, {
&#x9;				value: val,
&#x9;				enumerable: !0,
&#x9;				configurable: !0,
&#x9;				writable: !0,
&#x9;		  })
&#x9;		: (object[propertyName] = val),
&#x9;	object
&#x9;);
}

//Gradient object
class Gradient {
&#x9;/\*\*
&#x9; \* Represents the constructor of the Gradient class.
&#x9; \* @constructor
&#x9; \* @param {...any} t - The constructor parameters.
&#x9; \*/
&#x9;constructor(...t) {
&#x9;	e(this, "el", void 0),
&#x9;		e(this, "cssVarRetries", 0),
&#x9;		e(this, "maxCssVarRetries", 200),
&#x9;		e(this, "angle", 0),
&#x9;		e(this, "isLoadedClass", !1),
&#x9;		e(this, "isScrolling", !1),
&#x9;		/\*e(this, "isStatic", o.disableAmbientAnimations()),\*/ e(
&#x9;			this,
&#x9;			"scrollingTimeout",
&#x9;			void 0
&#x9;		),
&#x9;		e(this, "scrollingRefreshDelay", 200),
&#x9;		e(this, "isIntersecting", !1),
&#x9;		e(this, "shaderFiles", void 0),
&#x9;		e(this, "vertexShader", void 0),
&#x9;		e(this, "sectionColors", void 0),
&#x9;		e(this, "computedCanvasStyle", void 0),
&#x9;		e(this, "conf", void 0),
&#x9;		e(this, "uniforms", void 0),
&#x9;		e(this, "t", 1253106),
&#x9;		e(this, "last", 0),
&#x9;		e(this, "width", void 0),
&#x9;		e(this, "minWidth", 1111),
&#x9;		e(this, "height", 600),
&#x9;		e(this, "xSegCount", void 0),
&#x9;		e(this, "ySegCount", void 0),
&#x9;		e(this, "mesh", void 0),
&#x9;		e(this, "material", void 0),
&#x9;		e(this, "geometry", void 0),
&#x9;		e(this, "minigl", void 0),
&#x9;		e(this, "scrollObserver", void 0),
&#x9;		e(this, "amp", 320),
&#x9;		e(this, "seed", 5),
&#x9;		e(this, "freqX", 14e-5),
&#x9;		e(this, "freqY", 29e-5),
&#x9;		e(this, "freqDelta", 1e-5),
&#x9;		e(this, "activeColors", [1, 1, 1, 1]),
&#x9;		e(this, "isMetaKey", !1),
&#x9;		e(this, "isGradientLegendVisible", !1),
&#x9;		e(this, "isMouseDown", !1),
&#x9;		e(this, "handleScroll", () => {
&#x9;			clearTimeout(this.scrollingTimeout),
&#x9;				(this.scrollingTimeout = setTimeout(
&#x9;					this.handleScrollEnd,
&#x9;					this.scrollingRefreshDelay
&#x9;				)),
&#x9;				this.isGradientLegendVisible && this.hideGradientLegend(),
&#x9;				this.conf.playing && ((this.isScrolling = !0), this.pause());
&#x9;		}),
&#x9;		e(this, "handleScrollEnd", () => {
&#x9;			(this.isScrolling = !1), this.isIntersecting && this.play();
&#x9;		}),
&#x9;		e(this, "resize", () => {
&#x9;			(this.width = window\.innerWidth),
&#x9;				this.minigl.setSize(this.width, this.height),
&#x9;				this.minigl.setOrthographicCamera(),
&#x9;				(this.xSegCount = Math.ceil(this.width \* this.conf.density[0])),
&#x9;				(this.ySegCount = Math.ceil(this.height \* this.conf.density[1])),
&#x9;				this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount),
&#x9;				this.mesh.geometry.setSize(this.width, this.height),
&#x9;				(this.mesh.material.uniforms.u_shadow_power.value =
&#x9;					this.width < 600 ? 5 : 6);
&#x9;		}),
&#x9;		e(this, "handleMouseDown", (e) => {
&#x9;			this.isGradientLegendVisible &&
&#x9;				((this.isMetaKey = e.metaKey),
&#x9;				(this.isMouseDown = !0),
&#x9;				!1 === this.conf.playing && requestAnimationFrame(this.animate));
&#x9;		}),
&#x9;		e(this, "handleMouseUp", () => {
&#x9;			this.isMouseDown = !1;
&#x9;		}),
&#x9;		e(this, "animate", (e) => {
&#x9;			if (!this.shouldSkipFrame(e) || this.isMouseDown) {
&#x9;				if (
&#x9;					((this.t += Math.min(e - this.last, 1e3 / 15)),
&#x9;					(this.last = e),
&#x9;					this.isMouseDown)
&#x9;				) {
&#x9;					let e = 160;
&#x9;					this.isMetaKey && (e = -160), (this.t += e);
&#x9;				}
&#x9;				(this.mesh.material.uniforms.u_time.value = this.t),
&#x9;					this.minigl.render();
&#x9;			}
&#x9;			if (0 !== this.last && this.isStatic)
&#x9;				return this.minigl.render(), void this.disconnect();
&#x9;			/\*this.isIntersecting && \*/ (this.conf.playing || this.isMouseDown) &&
&#x9;				requestAnimationFrame(this.animate);
&#x9;		}),
&#x9;		e(this, "addIsLoadedClass", () => {
&#x9;			/\*this.isIntersecting && \*/ !this.isLoadedClass &&
&#x9;				((this.isLoadedClass = !0),
&#x9;				this.el.classList.add("isLoaded"),
&#x9;				setTimeout(() => {
&#x9;					this.el.parentElement.classList.add("isLoaded");
&#x9;				}, 3e3));
&#x9;		}),
&#x9;		e(this, "pause", () => {
&#x9;			this.conf.playing = false;
&#x9;		}),
&#x9;		e(this, "play", () => {
&#x9;			requestAnimationFrame(this.animate), (this.conf.playing = true);
&#x9;		}),
&#x9;		e(this, "initGradient", (selector) => {
&#x9;			this.el = document.querySelector(selector);
&#x9;			this.connect();
&#x9;			return this;
&#x9;		});
&#x9;}
&#x9;async connect() {
&#x9;	(this.shaderFiles = {
&#x9;		vertex:
&#x9;			"varying vec3 v_color;\n\nvoid main() {\n  float time = u_time \* u_global.noiseSpeed;\n\n  vec2 noiseCoord = resolution \* uvNorm \* u_global.noiseFreq;\n\n  vec2 st = 1. - uvNorm.xy;\n\n  //\n  // Tilting the plane\n  //\n\n  // Front-to-back tilt\n  float tilt = resolution.y / 2.0 \* uvNorm.y;\n\n  // Left-to-right angle\n  float incline = resolution.x \* uvNorm.x / 2.0 \* u_vertDeform.incline;\n\n  // Up-down shift to offset incline\n  float offset = resolution.x / 2.0 \* u_vertDeform.incline \* mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);\n\n  //\n  // Vertex noise\n  //\n\n  float noise = snoise(vec3(\n    noiseCoord.x \* u_vertDeform.noiseFreq.x + time \* u_vertDeform.noiseFlow,\n    noiseCoord.y \* u_vertDeform.noiseFreq.y,\n    time \* u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed\n  )) \* u_vertDeform.noiseAmp;\n\n  // Fade noise to zero at edges\n  noise \*= 1.0 - pow(abs(uvNorm.y), 2.0);\n\n  // Clamp to 0\n  noise = max(0.0, noise);\n\n  vec3 pos = vec3(\n    position.x,\n    position.y + tilt + incline + noise - offset,\n    position.z\n  );\n\n  //\n  // Vertex color, to be passed to fragment shader\n  //\n\n  if (u_active_colors[0] == 1.) {\n    v_color = u_baseColor;\n  }\n\n  for (int i = 0; i < u_waveLayers_length; i++) {\n    if (u_active_colors[i + 1] == 1.) {\n      WaveLayers layer = u_waveLayers[i];\n\n      float noise = smoothstep(\n        layer.noiseFloor,\n        layer.noiseCeil,\n        snoise(vec3(\n          noiseCoord.x \* layer.noiseFreq.x + time \* layer.noiseFlow,\n          noiseCoord.y \* layer.noiseFreq.y,\n          time \* layer.noiseSpeed + layer.noiseSeed\n        )) / 2.0 + 0.5\n      );\n\n      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));\n    }\n  }\n\n  //\n  // Finish\n  //\n\n  gl_Position = projectionMatrix \* modelViewMatrix \* vec4(pos, 1.0);\n}",
&#x9;		noise:
&#x9;			"//\n// Description : Array and textureless GLSL 2D/3D/4D simplex\n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : stegu\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               [https://github.com/ashima/webgl-noise\n//](https://github.com/ashima/webgl-noise\n//)               [https://github.com/stegu/webgl-noise\n//\n\nvec3](https://github.com/stegu/webgl-noise\n//\n\nvec3) mod289(vec3 x) {\n  return x - floor(x \* (1.0 / 289.0)) \* 289.0;\n}\n\nvec4 mod289(vec4 x) {\n  return x - floor(x \* (1.0 / 289.0)) \* 289.0;\n}\n\nvec4 permute(vec4 x) {\n    return mod289(((x\*34.0)+1.0)\*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 \* r;\n}\n\nfloat snoise(vec3 v)\n{\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  //   x0 = x0 - 0.0 + 0.0 \* C.xxx;\n  //   x1 = x0 - i1  + 1.0 \* C.xxx;\n  //   x2 = x0 - i2  + 2.0 \* C.xxx;\n  //   x3 = x0 - 1.0 + 3.0 \* C.xxx;\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0\*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D.yyy;      // -1.0+3.0\*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289(i);\n  vec4 p = permute( permute( permute(\n            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n// The ring size 17\*17 = 289 is close to a multiple of 49 (49\*6 = 294)\n  float n\_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n\_ \* D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 \* floor(p \* ns.z \* ns.z);  //  mod(p,7\*7)\n\n  vec4 x\_ = floor(j \* ns.z);\n  vec4 y\_ = floor(j - 7.0 \* x\_ );    // mod(j,N)\n\n  vec4 x = x\_ \*ns.x + ns.yyyy;\n  vec4 y = y\_ \*ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  //vec4 s0 = vec4(lessThan(b0,0.0))\*2.0 - 1.0;\n  //vec4 s1 = vec4(lessThan(b1,0.0))\*2.0 - 1.0;\n  vec4 s0 = floor(b0)\*2.0 + 1.0;\n  vec4 s1 = floor(b1)\*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw\*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw\*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 \*= norm.x;\n  p1 \*= norm.y;\n  p2 \*= norm.z;\n  p3 \*= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m \* m;\n  return 42.0 \* dot( m\*m, vec4( dot(p0,x0), dot(p1,x1),\n                                dot(p2,x2), dot(p3,x3) ) );\n}",
&#x9;		blend:
&#x9;			"//\n// [https://github.com/jamieowen/glsl-blend\n//\n\n//](https://github.com/jamieowen/glsl-blend\n//\n\n//) Normal\n\nvec3 blendNormal(vec3 base, vec3 blend) {\n\treturn blend;\n}\n\nvec3 blendNormal(vec3 base, vec3 blend, float opacity) {\n\treturn (blendNormal(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Screen\n\nfloat blendScreen(float base, float blend) {\n\treturn 1.0-((1.0-base)\*(1.0-blend));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend) {\n\treturn vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend, float opacity) {\n\treturn (blendScreen(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Multiply\n\nvec3 blendMultiply(vec3 base, vec3 blend) {\n\treturn base\*blend;\n}\n\nvec3 blendMultiply(vec3 base, vec3 blend, float opacity) {\n\treturn (blendMultiply(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Overlay\n\nfloat blendOverlay(float base, float blend) {\n\treturn base<0.5?(2.0\*base\*blend):(1.0-2.0\*(1.0-base)\*(1.0-blend));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend) {\n\treturn vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend, float opacity) {\n\treturn (blendOverlay(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Hard light\n\nvec3 blendHardLight(vec3 base, vec3 blend) {\n\treturn blendOverlay(blend,base);\n}\n\nvec3 blendHardLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendHardLight(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Soft light\n\nfloat blendSoftLight(float base, float blend) {\n\treturn (blend<0.5)?(2.0\*base\*blend+base\*base\*(1.0-2.0\*blend)):(sqrt(base)\*(2.0\*blend-1.0)+2.0\*base\*(1.0-blend));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend) {\n\treturn vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendSoftLight(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Color dodge\n\nfloat blendColorDodge(float base, float blend) {\n\treturn (blend==1.0)?blend\:min(base/(1.0-blend),1.0);\n}\n\nvec3 blendColorDodge(vec3 base, vec3 blend) {\n\treturn vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));\n}\n\nvec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendColorDodge(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Color burn\n\nfloat blendColorBurn(float base, float blend) {\n\treturn (blend==0.0)?blend\:max((1.0-((1.0-base)/blend)),0.0);\n}\n\nvec3 blendColorBurn(vec3 base, vec3 blend) {\n\treturn vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));\n}\n\nvec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendColorBurn(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Vivid Light\n\nfloat blendVividLight(float base, float blend) {\n\treturn (blend<0.5)?blendColorBurn(base,(2.0\*blend))\:blendColorDodge(base,(2.0\*(blend-0.5)));\n}\n\nvec3 blendVividLight(vec3 base, vec3 blend) {\n\treturn vec3(blendVividLight(base.r,blend.r),blendVividLight(base.g,blend.g),blendVividLight(base.b,blend.b));\n}\n\nvec3 blendVividLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendVividLight(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Lighten\n\nfloat blendLighten(float base, float blend) {\n\treturn max(blend,base);\n}\n\nvec3 blendLighten(vec3 base, vec3 blend) {\n\treturn vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));\n}\n\nvec3 blendLighten(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLighten(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Linear burn\n\nfloat blendLinearBurn(float base, float blend) {\n\t// Note : Same implementation as BlendSubtractf\n\treturn max(base+blend-1.0,0.0);\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendSubtract\n\treturn max(base+blend-vec3(1.0),vec3(0.0));\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearBurn(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Linear dodge\n\nfloat blendLinearDodge(float base, float blend) {\n\t// Note : Same implementation as BlendAddf\n\treturn min(base+blend,1.0);\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendAdd\n\treturn min(base+blend,vec3(1.0));\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearDodge(base, blend) \* opacity + base \* (1.0 - opacity));\n}\n\n// Linear light\n\nfloat blendLinearLight(float base, float blend) {\n\treturn blend<0.5?blendLinearBurn(base,(2.0\*blend))\:blendLinearDodge(base,(2.0\*(blend-0.5)));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend) {\n\treturn vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearLight(base, blend) \* opacity + base \* (1.0 - opacity));\n}",
&#x9;		fragment:
&#x9;			"varying vec3 v_color;\n\nvoid main() {\n  vec3 color = v_color;\n  if (u_darken_top == 1.0) {\n    vec2 st = gl_FragCoord.xy/resolution.xy;\n    color.g -= pow(st.y + sin(-12.0) \* st.x, u_shadow_power) \* 0.4;\n  }\n  gl_FragColor = vec4(color, 1.0);\n}",
&#x9;	}),
&#x9;		(this.conf = {
&#x9;			presetName: "",
&#x9;			wireframe: false,
&#x9;			density: [0.06, 0.16],
&#x9;			zoom: 1,
&#x9;			rotation: 0,
&#x9;			playing: true,
&#x9;		}),
&#x9;		document.querySelectorAll("canvas").length < 1
&#x9;			? console.log("DID NOT LOAD HERO STRIPE CANVAS")
&#x9;			: ((this.minigl = new MiniGl(this.el, null, null, !0)),
&#x9;			  requestAnimationFrame(() => {
&#x9;					this.el &&
&#x9;						((this.computedCanvasStyle = getComputedStyle(this.el)),
&#x9;						this.waitForCssVars());
&#x9;			  }));
&#x9;	/\*
          this.scrollObserver = await s.create(.1, !1),
          this.scrollObserver.observe(this.el),
          this.scrollObserver.onSeparate(() => {
              window\.removeEventListener("scroll", this.handleScroll), window\.removeEventListener("mousedown", this.handleMouseDown), window\.removeEventListener("mouseup", this.handleMouseUp), window\.removeEventListener("keydown", this.handleKeyDown), this.isIntersecting = !1, this.conf.playing && this.pause()
          }), 
          this.scrollObserver.onIntersect(() => {
              window\.addEventListener("scroll", this.handleScroll), window\.addEventListener("mousedown", this.handleMouseDown), window\.addEventListener("mouseup", this.handleMouseUp), window\.addEventListener("keydown", this.handleKeyDown), this.isIntersecting = !0, this.addIsLoadedClass(), this.play()
          })\*/
&#x9;}
&#x9;disconnect() {
&#x9;	this.scrollObserver &&
&#x9;		(window\.removeEventListener("scroll", this.handleScroll),
&#x9;		window\.removeEventListener("mousedown", this.handleMouseDown),
&#x9;		window\.removeEventListener("mouseup", this.handleMouseUp),
&#x9;		window\.removeEventListener("keydown", this.handleKeyDown),
&#x9;		this.scrollObserver.disconnect()),
&#x9;		window\.removeEventListener("resize", this.resize);
&#x9;}
&#x9;initMaterial() {
&#x9;	this.uniforms = {
&#x9;		u_time: new this.minigl.Uniform({
&#x9;			value: 0,
&#x9;		}),
&#x9;		u_shadow_power: new this.minigl.Uniform({
&#x9;			value: 5,
&#x9;		}),
&#x9;		u_darken_top: new this.minigl.Uniform({
&#x9;			value: "" === this.el.dataset.jsDarkenTop ? 1 : 0,
&#x9;		}),
&#x9;		u_active_colors: new this.minigl.Uniform({
&#x9;			value: this.activeColors,
&#x9;			type: "vec4",
&#x9;		}),
&#x9;		u_global: new this.minigl.Uniform({
&#x9;			value: {
&#x9;				noiseFreq: new this.minigl.Uniform({
&#x9;					value: [this.freqX, this.freqY],
&#x9;					type: "vec2",
&#x9;				}),
&#x9;				noiseSpeed: new this.minigl.Uniform({
&#x9;					value: 5e-6,
&#x9;				}),
&#x9;			},
&#x9;			type: "struct",
&#x9;		}),
&#x9;		u_vertDeform: new this.minigl.Uniform({
&#x9;			value: {
&#x9;				incline: new this.minigl.Uniform({
&#x9;					value: Math.sin(this.angle) / Math.cos(this.angle),
&#x9;				}),
&#x9;				offsetTop: new this.minigl.Uniform({
&#x9;					value: -0.5,
&#x9;				}),
&#x9;				offsetBottom: new this.minigl.Uniform({
&#x9;					value: -0.5,
&#x9;				}),
&#x9;				noiseFreq: new this.minigl.Uniform({
&#x9;					value: [3, 4],
&#x9;					type: "vec2",
&#x9;				}),
&#x9;				noiseAmp: new this.minigl.Uniform({
&#x9;					value: this.amp,
&#x9;				}),
&#x9;				noiseSpeed: new this.minigl.Uniform({
&#x9;					value: 10,
&#x9;				}),
&#x9;				noiseFlow: new this.minigl.Uniform({
&#x9;					value: 3,
&#x9;				}),
&#x9;				noiseSeed: new this.minigl.Uniform({
&#x9;					value: this.seed,
&#x9;				}),
&#x9;			},
&#x9;			type: "struct",
&#x9;			excludeFrom: "fragment",
&#x9;		}),
&#x9;		u_baseColor: new this.minigl.Uniform({
&#x9;			value: this.sectionColors[0],
&#x9;			type: "vec3",
&#x9;			excludeFrom: "fragment",
&#x9;		}),
&#x9;		u_waveLayers: new this.minigl.Uniform({
&#x9;			value: [],
&#x9;			excludeFrom: "fragment",
&#x9;			type: "array",
&#x9;		}),
&#x9;	};
&#x9;	for (let e = 1; e < this.sectionColors.length; e += 1)
&#x9;		this.uniforms.u_waveLayers.value.push(
&#x9;			new this.minigl.Uniform({
&#x9;				value: {
&#x9;					color: new this.minigl.Uniform({
&#x9;						value: this.sectionColors[e],
&#x9;						type: "vec3",
&#x9;					}),
&#x9;					noiseFreq: new this.minigl.Uniform({
&#x9;						value: [
&#x9;							2 + e / this.sectionColors.length,
&#x9;							3 + e / this.sectionColors.length,
&#x9;						],
&#x9;						type: "vec2",
&#x9;					}),
&#x9;					noiseSpeed: new this.minigl.Uniform({
&#x9;						value: 11 + 0.3 \* e,
&#x9;					}),
&#x9;					noiseFlow: new this.minigl.Uniform({
&#x9;						value: 6.5 + 0.3 \* e,
&#x9;					}),
&#x9;					noiseSeed: new this.minigl.Uniform({
&#x9;						value: this.seed + 10 \* e,
&#x9;					}),
&#x9;					noiseFloor: new this.minigl.Uniform({
&#x9;						value: 0.1,
&#x9;					}),
&#x9;					noiseCeil: new this.minigl.Uniform({
&#x9;						value: 0.63 + 0.07 \* e,
&#x9;					}),
&#x9;				},
&#x9;				type: "struct",
&#x9;			})
&#x9;		);
&#x9;	return (
&#x9;		(this.vertexShader = [
&#x9;			this.shaderFiles.noise,
&#x9;			this.shaderFiles.blend,
&#x9;			this.shaderFiles.vertex,
&#x9;		].join("\n\n")),
&#x9;		new this.minigl.Material(
&#x9;			this.vertexShader,
&#x9;			this.shaderFiles.fragment,
&#x9;			this.uniforms
&#x9;		)
&#x9;	);
&#x9;}
&#x9;initMesh() {
&#x9;	(this.material = this.initMaterial()),
&#x9;		(this.geometry = new this.minigl.PlaneGeometry()),
&#x9;		(this.mesh = new this.minigl.Mesh(this.geometry, this.material));
&#x9;}
&#x9;shouldSkipFrame(e) {
&#x9;	return (
&#x9;		!!window\.document.hidden ||
&#x9;		!this.conf.playing ||
&#x9;		parseInt(e, 10) % 2 == 0 ||
&#x9;		void 0
&#x9;	);
&#x9;}
&#x9;updateFrequency(e) {
&#x9;	(this.freqX += e), (this.freqY += e);
&#x9;}
&#x9;toggleColor(index) {
&#x9;	this.activeColors[index] = 0 === this.activeColors[index] ? 1 : 0;
&#x9;}
&#x9;showGradientLegend() {
&#x9;	this.width > this.minWidth &&
&#x9;		((this.isGradientLegendVisible = !0),
&#x9;		document.body.classList.add("isGradientLegendVisible"));
&#x9;}
&#x9;hideGradientLegend() {
&#x9;	(this.isGradientLegendVisible = !1),
&#x9;		document.body.classList.remove("isGradientLegendVisible");
&#x9;}
&#x9;init() {
&#x9;	this.initGradientColors(),
&#x9;		this.initMesh(),
&#x9;		this.resize(),
&#x9;		requestAnimationFrame(this.animate),
&#x9;		window\.addEventListener("resize", this.resize);
&#x9;}
&#x9;/\*
&#x9; \* Waiting for the css variables to become available, usually on page load before we can continue.
&#x9; \* Using default colors assigned below if no variables have been found after maxCssVarRetries
&#x9; \*/
&#x9;waitForCssVars() {
&#x9;	if (
&#x9;		this.computedCanvasStyle &&
&#x9;		-1 !==
&#x9;			this.computedCanvasStyle
&#x9;				.getPropertyValue("--gradient-color-1")
&#x9;				.indexOf("#")
&#x9;	)
&#x9;		this.init(), this.addIsLoadedClass();
&#x9;	else {
&#x9;		if (
&#x9;			((this.cssVarRetries += 1), this.cssVarRetries > this.maxCssVarRetries)
&#x9;		) {
&#x9;			return (
&#x9;				(this.sectionColors = [16711680, 16711680, 16711935, 65280, 255]),
&#x9;				void this.init()
&#x9;			);
&#x9;		}
&#x9;		requestAnimationFrame(() => this.waitForCssVars());
&#x9;	}
&#x9;}
&#x9;/\*
&#x9; \* Initializes the four section colors by retrieving them from css variables.
&#x9; \*/
&#x9;initGradientColors() {
&#x9;	this.sectionColors = [
&#x9;		"--gradient-color-1",
&#x9;		"--gradient-color-2",
&#x9;		"--gradient-color-3",
&#x9;		"--gradient-color-4",
&#x9;	]
&#x9;		.map((cssPropertyName) => {
&#x9;			let hex = this.computedCanvasStyle
&#x9;				.getPropertyValue(cssPropertyName)
&#x9;				.trim();
&#x9;			//Check if shorthand hex value was used and double the length so the conversion in normalizeColor will work.
&#x9;			if (4 === hex.length) {
&#x9;				const hexTemp = hex
&#x9;					.substr(1)
&#x9;					.split("")
&#x9;					.map((hexTemp) => hexTemp + hexTemp)
&#x9;					.join("");
&#x9;				hex = \`#${hexTemp}\`;
&#x9;			}
&#x9;			return hex && \`0x${hex.substr(1)}\`;
&#x9;		})
&#x9;		.filter(Boolean)
&#x9;		.map(normalizeColor);
&#x9;}
}

/\*
 \*Finally initializing the Gradient class, assigning a canvas to it and calling Gradient.connect() which initializes everything,
 \* Use Gradient.pause() and Gradient.play() for controls.
 \*
 \* Here are some default property values you can change anytime:
 \* Amplitude:    Gradient.amp = 0
 \* Colors:       Gradient.sectionColors (if you change colors, use normalizeColor(#hexValue)) before you assign it.
 \*
 \*
 \* Useful functions
 \* Gradient.toggleColor(index)
 \* Gradient.updateFrequency(freq)
 \*/

export { Gradient };

change the gradient color to black and white
