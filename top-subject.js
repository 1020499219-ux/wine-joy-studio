(() => {
  const root = document.querySelector('.top-subject');
  if (!root) return;

  const video = root.querySelector('video');
  const canvas = root.querySelector('canvas');
  if (!video || !canvas) return;

  video.loop = true;

  const startVideo = () => video.play().catch(() => {});
  video.addEventListener('canplay', startVideo, { once: true });
  startVideo();

  /* Prefer the pre-keyed VP9 asset directly. Its real alpha channel works on
     file:// as well as HTTP(S), so native-video compositing cannot expose the
     black source rectangle and no canvas upload is required. */
  const supportsAlphaWebm = video.canPlayType('video/webm; codecs="vp9"') !== '';
  if (supportsAlphaWebm) {
    root.classList.add('is-alpha-video');
    return;
  }

  /* Browsers that do not support VP9 alpha fall back to the MP4. HTTP(S) can
     still remove its black background through WebGL; local-file WebGL uploads
     are commonly restricted, so retain the old final fallback there. */
  if (location.protocol === 'file:') {
    root.classList.add('is-video-fallback');
    return;
  }

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });

  if (!gl) {
    root.classList.add('is-video-fallback');
    return;
  }

  const vertexSource = `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() {
      v_uv = a_uv;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_video;
    varying vec2 v_uv;

    void main() {
      vec2 sourceUv = vec2(mix(0.136, 0.864, v_uv.x), v_uv.y);
      vec3 color = texture2D(u_video, sourceUv).rgb;
      float keyValue = max(max(color.r, color.g), color.b);
      float alpha = smoothstep(0.008, 0.035, keyValue);
      float horizontalMatte = smoothstep(0.055, 0.14, v_uv.x) * smoothstep(0.055, 0.14, 1.0 - v_uv.x);
      float verticalMatte = smoothstep(0.035, 0.11, v_uv.y) * smoothstep(0.035, 0.11, 1.0 - v_uv.y);
      alpha *= horizontalMatte * verticalMatte;
      gl_FragColor = vec4(min(color, vec3(alpha)), alpha);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    }
    return shader;
  };

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program linking failed');
  }

  const vertices = new Float32Array([
    -1, -1, 0, 0,
     1, -1, 1, 0,
    -1,  1, 0, 1,
     1,  1, 1, 1
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
  const position = gl.getAttribLocation(program, 'a_position');
  const uv = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'u_video'), 0);
  gl.clearColor(0, 0, 0, 0);

  let canvasReady = false;

  const render = () => {
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      const croppedWidth = Math.round(video.videoWidth * (0.864 - 0.136));
      if (canvas.width !== croppedWidth || canvas.height !== video.videoHeight) {
        canvas.width = croppedWidth;
        canvas.height = video.videoHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!canvasReady) {
          canvasReady = true;
          root.classList.add('is-webgl-ready');
        }
      } catch {
        root.classList.add('is-video-fallback');
        return;
      }
    }
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
})();
