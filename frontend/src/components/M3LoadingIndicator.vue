<template>
  <div class="m3-loading-indicator">
    <div class="shape-morph"></div>
  </div>
</template>

<style scoped>
.m3-loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
}

.shape-morph {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0061A4 0%, #9ECAFF 100%);
  animation: morph 2.4s ease-in-out infinite, rotate 2.4s linear infinite;
}

@keyframes morph {
  0%, 100% {
    border-radius: 50%;
    transform: scale(1);
  }
  14% {
    border-radius: 50% 50% 50% 0;
    transform: scale(1.1);
  }
  28% {
    border-radius: 20%;
    transform: scale(0.9);
  }
  42% {
    border-radius: 50% 0 50% 50%;
    transform: scale(1.05);
  }
  57% {
    border-radius: 8px;
    transform: scale(0.95);
  }
  71% {
    border-radius: 0 50% 50% 50%;
    transform: scale(1.1);
  }
  85% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: scale(1);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 暗色模式 */
:root.v-theme--dark .shape-morph {
  background: linear-gradient(135deg, #9ECAFF 0%, #D1E4FF 100%);
}
</style>
