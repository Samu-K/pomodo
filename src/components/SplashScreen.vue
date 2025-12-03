<script setup lang="ts">
</script>

<template>
  <div class="splash-container">
    <h1>Pomodo</h1>
    <img src="/icon.png" alt="Pomodo Logo" class="logo">
  </div>
</template>

<style scoped>
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  gap: 20px;
}

.logo {
  width: 80px;
  height: 80px;
  animation: pulse 2s infinite ease-in-out;
}

h1 {
  font-size: 24px;
  margin: 0;
  font-weight: 500;
  letter-spacing: 1px;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
</style>
