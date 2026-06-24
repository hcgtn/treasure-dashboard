<template>
  <canvas ref="canvasRef" class="particle-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const PARTICLE_COUNT = 100
const CONNECT_DIST = 120
let particles = []
let animationId = null
let mouse = { x: -999, y: -999 }

class Particle {
  constructor(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = (Math.random() - 0.5) * 0.6
    this.vy = (Math.random() - 0.5) * 0.6
    this.radius = Math.random() * 2 + 1
    this.opacity = Math.random() * 0.5 + 0.2
  }

  update(w, h) {
    this.x += this.vx
    this.y += this.vy

    // 边界反弹
    if (this.x < 0 || this.x > w) this.vx *= -1
    if (this.y < 0 || this.y > h) this.vy *= -1

    // 鼠标吸引
    const dx = mouse.x - this.x
    const dy = mouse.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 150) {
      this.x += dx * 0.003
      this.y += dy * 0.003
    }
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 229, 255, ${this.opacity})`
    ctx.fill()
  }
}

function init() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(1920, 1080))
  }
  animate(ctx)
}

function animate(ctx) {
  const canvas = canvasRef.value
  if (!canvas) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 更新和绘制粒子
  particles.forEach(p => {
    p.update(canvas.width, canvas.height)
    p.draw(ctx)
  })

  // 连线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CONNECT_DIST) {
        const alpha = (1 - dist / CONNECT_DIST) * 0.2
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(0, 150, 255, ${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  }

  animationId = requestAnimationFrame(() => animate(ctx))
}

function onMouseMove(e) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    mouse.x = (e.clientX - rect.left) * (1920 / rect.width)
    mouse.y = (e.clientY - rect.top) * (1080 / rect.height)
  }
}

onMounted(() => {
  init()
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
