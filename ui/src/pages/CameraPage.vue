<template>
  <div class="camera-back main-bevel">
    <div class="top-container main-bevel metal"></div>
    <div class="bottom-container main-bevel metal"></div>
    <img class="viewfinder-image" src="viewfinder.png" alt="Viewfinder" />
    <div class="viewfinder">
      <video ref="videoRef" autoplay playsinline muted></video>
    </div>
    <img class="logo-image" src="fsg.png" alt="Logo" />
    <img class="back-latch-image" src="back-latch.png" alt="BackLatch" />
    <img id="leaver" class="leaver-image" src="leaver.png" alt="Leaver" />
    <img id="shutter" class="shutter-image" src="shutter.png" alt="Shutter" />
    <img class="counter-frame-image" src="counter-frame.png" alt="CounterFrame" />
    <div class="counter-dial-perimeter">
      <div class="counter-dial" :style="{ transform: `rotate(${dialAngle}deg)` }">
        <div
          class="tick-container"
          v-for="n in totalShots"
          :key="n"
          :style="{ transform: `rotate(${(n - 1) * angleStep}deg)` }"
        >
          <span v-if="(n - 1) % 4 === 0" class="label">{{ n - 1 }}</span>
          <span class="tick"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const videoRef = ref<HTMLVideoElement | null>(null);
let stream: MediaStream | null = null;

let leaverClicks: Array<number> = [];
const baseAngle = 35;
const minAngle = -35;

let endClickTriggered = false;

let shutterArmed = false;

const totalShots = 27;
const dialAngle = ref(0);
const angleStep = -360 / totalShots;

function resetLeaverClicks() {
  leaverClicks = [];
  for (let i = baseAngle; i > minAngle; i -= 7.5) {
    leaverClicks.push(i);
  }
}

function incrementDial() {
  dialAngle.value -= angleStep;
  if (dialAngle.value <= -360) {
    dialAngle.value = 0;
  }
}

function shouldLeaverClick(angle: number): boolean {
  if (leaverClicks.length === 0) return false;
  const nextClickAngle = leaverClicks[0];
  if (!nextClickAngle) return false;
  if (angle <= nextClickAngle) {
    leaverClicks.shift();
    return true;
  }
  return false;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shutterVibrate() {
  await Haptics.impact({ style: ImpactStyle.Heavy });
  await sleep(40);
  await Haptics.impact({ style: ImpactStyle.Light });
  await sleep(75);
  await Haptics.impact({ style: ImpactStyle.Medium });
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    if (videoRef.value) videoRef.value.srcObject = stream;
  } catch (e) {
    console.error(e);
  }
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
}

function addShutterEvent() {
  const shutter = document.getElementById('shutter');
  if (!shutter) return;
  shutter.addEventListener('click', () => {
    void (async () => {
      incrementDial();

      if (!shutterArmed) {
        await Haptics.impact({ style: ImpactStyle.Light });

        console.log('Shutter not armed');
        return;
      }
      shutterArmed = false;
      await shutterVibrate();
      resetLeaverClicks();
    })();
  });
}

function addLeaverEvent() {
  resetLeaverClicks();
  console.log('Leaver clicks:', leaverClicks);
  const leaver = document.getElementById('leaver') as HTMLElement;
  if (!leaver) return;
  let dragging = false;
  let startY = 0;

  const sensitivity = 2;

  leaver.style.transform = `rotate(${baseAngle}deg)`;
  leaver.style.transition = 'transform 0.2s ease';

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientY - startY;
    let angle = baseAngle + -delta / sensitivity;
    angle = Math.max(Math.min(angle, baseAngle), minAngle);
    leaver.style.transform = `rotate(${angle}deg)`;
    if (shouldLeaverClick(angle)) {
      void Haptics.impact({ style: ImpactStyle.Light });
    }

    if (angle <= minAngle && !endClickTriggered) {
      endClickTriggered = true;
      void Haptics.impact({ style: ImpactStyle.Heavy });
      shutterArmed = true;
    }
  };

  const onPointerUp = () => {
    dragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    leaver.style.transition = 'transform 0.2s ease';
    leaver.style.transform = `rotate(${baseAngle}deg)`;
    endClickTriggered = false;
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    leaver.style.transition = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  leaver.removeAttribute('draggable');
  leaver.addEventListener('pointerdown', onPointerDown);
}

onMounted(async () => {
  await startCamera();
  addShutterEvent();
  addLeaverEvent();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
html,
body {
  overflow: hidden;
}

.camera-back {
  position: absolute;
  width: 100vw;
  height: 100vh;
  background-image: url('leather.png');
  background-repeat: repeat;
  background-size: auto 400px;
  overflow: hidden;
}

.top-container {
  position: absolute;
  width: 100vw;
  height: 30vh;
}

.bottom-container {
  position: absolute;
  width: 100vw;
  height: 7vh;
  top: 93vh;
}

.metal {
  /* background-color: rgb(150, 150, 150, 1); */
  background-color: #2a2a2c;
}

.main-bevel {
  box-shadow:
    inset 5vw 0 4vw rgba(0, 0, 0, 0.6),
    inset -5vw 0 4vw rgba(255, 255, 255, 0.2);
}

.viewfinder {
  position: absolute;
  width: 20vh;
  height: 12vh;
  left: 6vw;
  top: 9vh;
}

.viewfinder-image {
  position: absolute;
  width: 28vh;
  height: 28vh;
  left: 5vw;
  top: 1vh;
  z-index: 10;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-image {
  position: absolute;
  width: 12vh;
  height: 12vh;
  left: 50%;
  transform: translateX(-50%);
  top: 10vh;
}

.back-latch-image {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 63vh;
  top: 30vh;
}

.leaver-image {
  position: absolute;
  width: 80vh;
  height: 80vh;
  top: -25vh;
  right: 0;
  transform: rotate(35deg);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.leaver-image:active {
  cursor: grabbing;
}

.shutter-image {
  position: absolute;
  width: 17vh;
  height: 17vh;
  right: 23vh;
  transform: translateX(-50%);
  top: 7vh;
  cursor: pointer;
}

.counter-frame-image {
  position: absolute;
  width: 15vh;
  height: 15vh;
  right: 16vh;
  top: 9vh;
  /* transform: translateX(-50%); */
  cursor: pointer;
  z-index: 11;
}

.counter-dial-perimeter {
  position: absolute;
  width: 14vh;
  height: 14vh;
  right: 16.75vh;
  top: 9vh;
  /* transform: translateX(-50%); */
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  z-index: 10;
}

.counter-dial {
  position: absolute;

  top: 6vh;
  right: -1.25vh;

  width: 16vh;
  height: 16vh;

  background: #ffffff;
  border-radius: 50%;
  outline: 2px solid #000;
  z-index: 1;
  transition: transform 0.2s ease;
}
.tick-container {
  position: absolute;
  top: 8vh;
  left: 50%;
  transform-origin: bottom center;
}
.tick {
  position: absolute;
  top: -8vh;
  left: 0vh;

  width: 2px;
  height: 5px;
  background: #000;
  transform-origin: bottom center;
}
.label {
  position: absolute;
  top: -6.5vh;
  left: -0.75vh;
  font-size: 2.5vh;
  text-align: center;
}
</style>
