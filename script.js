// Enhanced Point Class
function Point(pos) {
    this.x = pos.x - canvas.width / 2 || 0;
    this.y = pos.y - canvas.height / 2 || 0;
    this.z = pos.z || 0;
    this.cX = 0;
    this.cY = 0;
    this.cZ = 0;
    this.xPos = 0;
    this.yPos = 0;
    this.map2D();
  }
  Point.prototype.rotateX = function (angleX) {
    var cosX = Math.cos(angleX),
      sinX = Math.sin(angleX),
      y1 = this.y * cosX - this.z * sinX,
      z1 = this.z * cosX + this.y * sinX;
    this.y = y1;
    this.z = z1;
  };
  Point.prototype.rotateY = function (angleY) {
    var cosY = Math.cos(angleY),
      sinY = Math.sin(angleY),
      x1 = this.x * cosY - this.z * sinY,
      z1 = this.z * cosY + this.x * sinY;
    this.x = x1;
    this.z = z1;
  };
  Point.prototype.map2D = function () {
    var scale = focal / (focal + this.z + this.cZ);
    this.xPos = vpx + (this.cX + this.x) * scale;
    this.yPos = vpy + (this.cY + this.y) * scale;
  };
  
  function Line(points, color) {
    this.points = points || [];
    this.dist = 0;
    this.visiblePoints = 0;
    this.growthRate = 0.03 + Math.random() * 0.05;
    this.rotationSpeed = 0.003 + Math.random() * 0.006;
    this.age = 0;
    this.maxAge = 400 + Math.random() * 800;
    this.particles = [];
    this.maxParticles = 15;
  
    if (!color) {
      const hue = Math.random() * 360;
      const saturation = 70 + Math.random() * 30;
      const lightness = 50 + Math.random() * 30;
      this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
      this.glowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
    } else {
      this.color = color;
      this.glowColor = color.replace("1)", "0.3)");
    }
    this.originalColor = this.color;
    this.originalGlow = this.glowColor;
  }
  
  Line.prototype.update = function () {
    // Update line growth
    this.visiblePoints = Math.min(
      this.points.length,
      this.visiblePoints + this.growthRate
    );
  
    // Age the line
    this.age++;
  
    // Fade out as line ages
    var fade = Math.max(0, 1 - this.age / this.maxAge);
    this.color = this.originalColor.replace("1)", fade + ")");
    this.glowColor = this.originalGlow.replace("0.3)", fade * 0.3 + ")");
  
    // Randomly remove points as line ages
    if (
      this.visiblePoints >= this.points.length &&
      Math.random() > 0.93 &&
      this.points.length > 5
    ) {
      this.points.shift();
      this.visiblePoints = Math.max(0, this.visiblePoints - 1);
    }
  
    // Update points rotation
    for (var p = 0; p < this.points.length; p++) {
      this.points[p].rotateX(0.003);
      this.points[p].rotateY(0.003 + this.rotationSpeed);
      this.points[p].map2D();
    }
  
    // Add particles at the end of the line
    if (
      this.visiblePoints > 5 &&
      this.points.length > 0 &&
      this.particles.length < this.maxParticles &&
      Math.random() > 0.7
    ) {
      const lastVisible = Math.min(
        Math.floor(this.visiblePoints),
        this.points.length - 1
      );
      if (lastVisible > 0) {
        const point = this.points[lastVisible];
        this.particles.push({
          x: point.xPos,
          y: point.yPos,
          size: 1 + Math.random() * 3,
          life: 20 + Math.random() * 30,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          color: this.color
        });
      }
    }
  
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].x += this.particles[i].speedX;
      this.particles[i].y += this.particles[i].speedY;
      this.particles[i].life--;
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  };
  
  Line.prototype.render = function () {
    const lastVisible = Math.min(
      Math.floor(this.visiblePoints),
      this.points.length - 1
    );
    // Render glow effect
    if (lastVisible > 0) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.glowColor;
      // Draw main line with variable thickness
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5 + (this.points[lastVisible].z + 100) / 200;
      ctx.beginPath();
      ctx.moveTo(this.points[0].xPos, this.points[0].yPos);
      for (var p = 0; p < lastVisible; p++) {
        const currentPoint = this.points[p];
        const nextPoint = this.points[p + 1];
        // Check if both current and next points are in front of the camera
        if (currentPoint.z > -focal && nextPoint.z > -focal) {
          var xc = (currentPoint.xPos + nextPoint.xPos) / 2;
          var yc = (currentPoint.yPos + nextPoint.yPos) / 2;
          if (p === 0) {
            ctx.moveTo(currentPoint.xPos, currentPoint.yPos);
          }
          ctx.quadraticCurveTo(currentPoint.xPos, currentPoint.yPos, xc, yc);
        } else {
          // If the segment is invalid, move to the next point to break the path
          ctx.moveTo(nextPoint.xPos, nextPoint.yPos);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Render particles
    this.particles.forEach((particle) => {
      const alpha = particle.life / 50;
      ctx.fillStyle = particle.color.replace("1)", `${alpha})`);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    this.dist =
      this.points.length > 0 ? this.points[this.points.length - 1].z : 0;
  };
  
  // Main Setup
  var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = innerHeight;
  var lines = [],
    focal = canvas.width / 2,
    vpx = canvas.width / 2,
    vpy = canvas.height / 2,
    settings = {
      smoothness: 0.6,
      lineCount: 8,
      globalRotation: 0,
      colorMode: "hsl"
    };
  
  // Create more organic, vibrant lines
  function createSmoothLine() {
    var points = [];
    var startX = Math.random() * canvas.width;
    var startY = Math.random() * canvas.height;
  
    // Generate vibrant color
    let color;
    if (settings.colorMode === "hsl") {
      const hue = Math.random() * 360;
      const saturation = 70 + Math.random() * 30;
      const lightness = 50 + Math.random() * 30;
      color = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
    } else {
      const r = 150 + Math.random() * 105;
      const g = 150 + Math.random() * 105;
      const b = 150 + Math.random() * 105;
      color = `rgba(${r},${g},${b},1)`;
    }
  
    var line = new Line(points, color);
  
    // Create control points with more organic variation
    var segments = 25 + Math.floor(Math.random() * 20);
    var radiusX = (canvas.width / 3) * (0.7 + Math.random() * 0.6);
    var radiusY = (canvas.height / 3) * (0.7 + Math.random() * 0.6);
  
    for (var i = 0; i <= segments; i++) {
      var progress = i / segments;
      var angle = progress * Math.PI * 2;
  
      // Base position
      var x = startX + Math.cos(angle) * radiusX * settings.smoothness;
      var y = startY + Math.sin(angle) * radiusY * settings.smoothness;
      var z = (Math.random() - 0.5) * 250;
  
      // Add organic noise
      var noiseScale = 0.5 + progress * 0.5;
      x += (((Math.random() - 0.5) * canvas.width) / 10) * noiseScale;
      y += (((Math.random() - 0.5) * canvas.height) / 10) * noiseScale;
      z += (Math.random() - 0.5) * 100 * noiseScale;
  
      line.points.push(new Point({ x: x, y: y, z: z }));
    }
  
    lines.push(line);
    return line;
  }
  
  // Animation Loop
  function demo() {
    // Clear with semi-transparent background for motion trails
    ctx.fillStyle = "rgba(10, 10, 15, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Add new lines if needed
    if (lines.length < settings.lineCount && Math.random() > 0.7) {
      createSmoothLine();
    }
  
    // Update global rotation
    settings.globalRotation += 0.0015;
  
    // Update and render all lines
    lines.sort((a, b) => b.dist - a.dist);
  
    // Filter out old lines
    lines = lines.filter(function (line) {
      line.update();
      line.render();
      return line.age < line.maxAge && line.points.length > 2;
    });
  
    requestAnimationFrame(demo);
  }
  
  // Initialize with some lines
  for (var i = 0; i < 5; i++) {
    createSmoothLine();
  }
  demo();
  
  // Handle Resize
  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = innerHeight;
    focal = canvas.width / 2;
    vpx = canvas.width / 2;
    vpy = canvas.height / 2;
  });
  