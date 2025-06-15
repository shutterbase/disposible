<template>
  <div class="camera-container">
    <!-- The simulated viewfinder -->
    <div class="viewfinder">
      <video ref="videoRef" autoplay playsinline muted></video>
    </div>
    <button class="shutter-button">Take photo</button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const videoRef = ref<HTMLVideoElement | null>(null);
let stream: MediaStream | null = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // use back camera on phones
      },
      audio: false,
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

onMounted(async () => {
  await startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

.viewfinder {
  width: 300px;
  height: 200px;
  border: 2px solid white;
  overflow: hidden;
  border-radius: 8px;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
