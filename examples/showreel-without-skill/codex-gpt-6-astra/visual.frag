#version 330
uniform vec2 resolution;
uniform float time;
uniform int scene;
uniform vec3 paper;
uniform vec2 objectCenter;
uniform float objectScale;
uniform sampler2D backLayer;
uniform sampler2D frontLayer;
uniform vec4 balls[49];
out vec4 fragColor;

mat2 turn(float angle) {
    float sine = sin(angle), cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
}
vec3 rotateObject(vec3 point) {
    point.xy = turn(0.28 + time * 0.23) * point.xy;
    point.xz = turn(time * 0.42 + 0.4) * point.xz;
    point.yz = turn(0.55 + 0.25 * sin(time * 0.7)) * point.yz;
    return point;
}
float shape(vec3 point) {
    point = rotateObject(point);
    float angle = atan(point.z, point.x);
    float ring = 1.02 + 0.105 * cos(angle * 3.0);
    vec2 section = vec2(length(point.xz) - ring, point.y - 0.18 * sin(angle * 3.0));
    section = turn(angle * 1.5 + 0.35) * section;
    return (length(section / vec2(0.52, 0.28)) - 1.0) * 0.24;
}
vec3 surfaceNormal(vec3 point) {
    vec2 epsilon = vec2(0.0018, -0.0018);
    return normalize(epsilon.xyy * shape(point + epsilon.xyy) + epsilon.yyx * shape(point + epsilon.yyx) + epsilon.yxy * shape(point + epsilon.yxy) + epsilon.xxx * shape(point + epsilon.xxx));
}
vec3 studio(vec3 direction) {
    vec3 color = mix(vec3(0.028, 0.035, 0.042), vec3(0.29, 0.33, 0.35), smoothstep(-0.6, 0.9, direction.y));
    float softbox = pow(max(dot(direction, normalize(vec3(-0.5, 0.8, 0.6))), 0.0), 8.0);
    float strip = smoothstep(0.16, 0.21, direction.x) * (1.0 - smoothstep(0.44, 0.49, direction.x));
    strip *= smoothstep(-0.65, -0.5, direction.y) * (1.0 - smoothstep(0.8, 0.9, direction.y));
    float panel = smoothstep(0.32, 0.36, direction.y) * (1.0 - smoothstep(0.67, 0.72, direction.y));
    panel *= smoothstep(-0.9, -0.65, direction.x) * (1.0 - smoothstep(0.3, 0.45, direction.x));
    color += vec3(1.6, 1.55, 1.44) * softbox;
    color += vec3(2.5, 2.65, 2.7) * strip;
    color += vec3(1.4, 1.4, 1.3) * panel;
    color += vec3(1.0, 0.08, 0.018) * pow(max(dot(direction, normalize(vec3(0.8, -0.4, 0.0))), 0.0), 13.0) * 1.6;
    return color;
}
vec3 material(vec3 point, vec3 normal, vec3 ray, int kind) {
    vec3 reflected = reflect(ray, normal);
    vec3 light = normalize(vec3(-0.6, 0.8, 1.0));
    float diffuse = max(dot(normal, light), 0.0);
    float fresnel = pow(1.0 - max(dot(normal, -ray), 0.0), 4.0);
    float specular = pow(max(dot(reflect(-light, normal), -ray), 0.0), 65.0);
    vec3 color;
    if (kind == 0) {
        color = vec3(0.9, 0.055, 0.008) * (0.3 + 0.76 * diffuse);
        color += studio(reflected) * (0.10 + 0.40 * fresnel);
        color += vec3(1.0, 0.73, 0.45) * specular * 0.65;
    } else if (kind == 1) {
        color = studio(reflected) * vec3(0.94, 0.96, 1.0);
        color += diffuse * 0.035;
        color *= 0.72 + 0.28 * fresnel;
    } else {
        color = vec3(0.007, 0.010, 0.012) * (0.4 + diffuse);
        color += studio(reflected) * (0.045 + 0.56 * fresnel);
        color += specular * 0.17;
    }
    return pow(max(color, vec3(0.0)), vec3(0.4545));
}
float noise(vec2 point) {
    return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
    vec3 color = paper;
    float vignette = length((pixel / resolution - 0.5) * vec2(1.0, 0.8));
    color *= 1.016 - vignette * 0.028;
    if (scene == 2) {
        float pool = exp(-dot((pixel - objectCenter) / 750.0, (pixel - objectCenter) / 750.0) * 1.7);
        color += vec3(0.062, 0.069, 0.075) * pool;
    }
    vec4 behind = texture(backLayer, vec2(uv.x, 1.0 - uv.y));
    color = mix(color, behind.rgb, behind.a);
    if (scene == 0 || scene == 2 || scene == 4) {
        vec2 screen = (pixel - objectCenter) / objectScale;
        screen.y *= -1.0;
        if (length(screen) < 1.9) {
            vec3 origin = vec3(0.0, 0.0, 5.0);
            vec3 ray = normalize(vec3(screen, -4.2));
            float travel = 2.4;
            bool hit = false;
            for (int step = 0; step < 100; step++) {
                float distance = shape(origin + ray * travel);
                if (distance < 0.0016) { hit = true; break; }
                travel += distance * 0.85;
                if (travel > 7.0) break;
            }
            if (hit) {
                vec3 point = origin + ray * travel;
                vec3 normal = surfaceNormal(point);
                int kind = scene == 0 ? 0 : (scene == 2 ? 1 : 2);
                vec3 shaded = material(point, normal, ray, kind);
                float occlusion = clamp(shape(point + normal * 0.18) / 0.18, 0.3, 1.0);
                shaded *= 0.80 + 0.2 * occlusion;
                color = shaded;
            }
        }
    }
    if (scene == 3) {
        for (int index = 0; index < 49; index++) {
            vec4 ball = balls[index];
            vec2 plane = (pixel - ball.xy) / ball.z;
            float radius2 = dot(plane, plane);
            if (radius2 < 1.0) {
                vec3 normal = vec3(plane.x, -plane.y, sqrt(1.0 - radius2));
                int kind = int(ball.w + 0.1);
                vec3 shaded = material(vec3(0.0), normal, vec3(0.0, 0.0, -1.0), kind);
                float edge = 1.0 - smoothstep(0.975, 1.0, radius2);
                color = mix(color, shaded, edge);
            }
        }
    }
    vec4 front = texture(frontLayer, vec2(uv.x, 1.0 - uv.y));
    color = mix(color, front.rgb, front.a);
    color += (noise(pixel + mod(time * 60.0, 400.0)) - 0.5) * 0.005;
    fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
